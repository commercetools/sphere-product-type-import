import { SphereClient } from 'sphere-node-sdk'
import Promise from 'bluebird'
import _ from 'lodash'
import initAjv from 'ajv'

const ajv = initAjv({ removeAdditional: true })
const validate = ajv.compile({
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    key: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
  },
  required: ['name', 'description'],
  additionalProperties: false,
})

export default class ProductTypeImport {

  constructor (logger, { sphereClientConfig, importerConfig }) {
    this.logger = logger
    this.client = new SphereClient(sphereClientConfig)
    this.productTypes = {}

    this.config = _.assign({}, importerConfig)

    this.summary = {
      errors: [],
      inserted: [],
      successfullImports: 0
    }
  }

  summaryReport () {
    return JSON.stringify(this.summary, null, 2)
  }

  processStream (productTypes, next) {
    // process batch
    return Promise.map(productTypes, (productType) => {
      return this.importProductType(productType)
    })
    .then(() => {
      // call next for next batch
      next()
    })
    // errors get catched in the node-cli which also calls for the next chunk
    // if an error occured in this chunk
  }

  importProductType (productType) {
    return this.validateProductType(productType)
    .then(() => {
      return this._importValidatedProductType(productType)
    })
    .catch((error) => {
      this.summary.errors.push({ productType, error })
    })
  }

  _importValidatedProductType (productType) {
    return this.client.productTypes.where(`key="${productType.key}"`).fetch()
    .then(({ body: { total, results: productTypes } }) => {
      if (total > 0) {
        const [existingType] = productTypes
        const { version, id } = existingType

        const actions = this.buildUpdateActions(productType, existingType)

        return this.client.productTypes.byId(id).update({
          version,
          actions
        })
      } else {
        return this.client.productTypes.save(productType)
      }
    })
    .then(() => {
      this.summary.inserted.push(productType.name)
      this.summary.successfullImports = this.summary.successfullImports + 1
      return productType
    })
    .catch((error) => {
      // TODO: potentially handle duplicate field error here
      // if (error.body && error.body.message && !~error.body.message.indexOf('already exists'))
      throw error
    })
  }

  buildUpdateActions (productType, existingProductType) {
    // Add attributes to existing product types.
    // Existing attributes are filtered out.
    return productType.attributes
    .filter(attr =>
      !existingProductType.attributes.find(existingAttribute =>
        existingAttribute.name === attr.name
      )
    )
    .map(attr => ({
      action: 'addAttributeDefinition',
      attribute: attr
    }))
  }

  validateProductType (productType) {
    const isValid = validate(productType)
    if (isValid) {
      return Promise.resolve()
    } else {
      return Promise.reject(validate.errors)
    }
  }
}
