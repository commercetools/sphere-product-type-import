import { expect } from 'chai'
import ProductTypeImport from '../../src'
import { SphereClient } from 'sphere-node-sdk'
import { getSphereClientCredentials } from '../../src/utils'
import Promise from 'bluebird'

const PROJECT_KEY = process.env.SPHERE_TEST_PROJECT_KEY || 'sphere-node-product-type-import'
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  error: console.error
}
const deleteAll = (service, client) => {
  return client[service].process(({ body: { results } }) => {
    return Promise.map(results, (productType) => {
      return client[service].byId(productType.id)
      .delete(productType.version)
    })
  })
}

describe('productType import module', function () {

  this.timeout(10000)

  let client
  let productTypeImport

  beforeEach((done) => {
    getSphereClientCredentials(PROJECT_KEY)
    .then(sphereCredentials => {
      const options = {
        config: sphereCredentials
      }
      client = new SphereClient(options)

      productTypeImport = new ProductTypeImport(
        logger,
        { sphereClientConfig: options }
      )
      deleteAll('productTypes', client)
      .then(() => {
        done()
      })
      .catch(done)
    })
  })

  it('should import a complete product type', (done) => {
    const productType = {
      "key": "random-key",
      "name": "custom-product-type",
      "description": "Some cool description",
      "attributes": [
        {
          "name": "breite",
          "label": {
            "de": "Breite"
          },
          "type": {
            "name": "number"
          },
          "attributeConstraint": "None",
          "isRequired": false,
          "isSearchable": false
        },
        {
          "name": "farbe",
          "label": {
            "de": "Farbe"
          },
          "type": {
            "name": "ltext"
          },
          "attributeConstraint": "None",
          "isRequired": false,
          "isSearchable": false,
          "inputHint": "SingleLine"
        }
      ]
    }
    productTypeImport.importProductType(productType)
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
      .then(({ body: { results: productTypes } }) => {
        const actual = productTypes.length
        const expected = 1

        expect(actual).to.equal(expected)
        done()
      })
    })
    .catch((err) => {
      console.log(JSON.stringify(err, null, 2))
      done(err)
    })
  })

  it('should add an attribute to an existing product type', (done) => {
    const productType = {
      "key": "random-key",
      "name": "custom-product-type",
      "description": "Some cool description",
      "attributes": [
        {
          "name": "breite",
          "label": {
            "de": "Breite"
          },
          "type": {
            "name": "number"
          },
          "attributeConstraint": "None",
          "isRequired": false,
          "isSearchable": false
        }
      ]
    }
    const updatedProductType = Object.assign({}, productType, {
      attributes: [{
        "name": "farbe",
        "label": {
          "de": "Farbe"
        },
        "type": {
          "name": "ltext"
        },
        "attributeConstraint": "None",
        "isRequired": false,
        "isSearchable": false,
        "inputHint": "SingleLine"
      }]
    })
    productTypeImport.importProductType(productType)
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const actual = productTypes.length
      const expected = 1

      expect(actual).to.equal(expected)
    })
    .then(() => {
      return productTypeImport.importProductType(updatedProductType)
    })
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0
      expect(actual).to.equal(expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const [importedProductType] = productTypes
      expect(importedProductType.attributes.map(a => a.name)).to.deep.equal(['breite', 'farbe'])
      done()
    })
    .catch((err) => {
      console.log(JSON.stringify(err, null, 2))
      done(err)
    })
  })
})
