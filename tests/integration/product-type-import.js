import _ from 'lodash'
import { expect } from 'chai'
import ProductTypeImport from '../../src'
import { SphereClient } from 'sphere-node-sdk'
import { getSphereClientCredentials } from '../../src/utils'
import Promise from 'bluebird'

const PROJECT_KEY = 'sphere-node-product-type-import'
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  error: console.error
}

describe('productType import module', function () {

  this.timeout(100000)

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
      done()
    })
  })

  afterEach((done) => {
    // remove all productTypes
    const deleteAll = (service) => {
      return client[service].process(({ body: { results } }) => {
        return Promise.map(results, (productType) => {
          return client[service].byId(productType.id)
          .delete(productType.version)
        })
      })
    }
    deleteAll('productTypes')
    .then(() => {
      done()
    })
    .catch(done)
  })

  it('should import a complete product type', (done) => {
    const productType = {
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
})
