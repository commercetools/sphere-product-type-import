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
    // validate productType object
    return this.validateProductType(productType)
    .then(() => {
      // try to import productType
      return this._importValidatedProductType(productType)
      // check if productType already existed
      // update productType
      // successfully imported
    })
    .catch((error) => {
      this.summary.errors.push({ productType, error })
    })
  }

  _importValidatedProductType (productType) {
    return new Promise((resolve, reject) => {
      this.client.productTypes.save(productType)
      .then(() => {
        this.summary.inserted.push(productType.name)
        this.summary.successfullImports = this.summary.successfullImports + 1
        resolve(productType)
      })
      .catch((error) => {
        // TODO: potentially handle duplicate field error here
        return reject(error)
      })
    })
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
