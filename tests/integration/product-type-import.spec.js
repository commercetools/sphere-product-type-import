import { expect } from 'chai'
import { SphereClient } from 'sphere-node-sdk'
import Promise from 'bluebird'
import ProductTypeImport from '../../src'
import getSphereClientCredentials from '../../src/utils'

require('babel-core').transform('code', {
  plugins: ['transform-runtime'],
})

const PROJECT_KEY = 'sphere-node-product-type-import'
/* eslint-disable no-console */
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  error: console.error,
}
/* eslint-enable no-console */
const deleteAll = (service, client) => client[service].process(
  ({ body: { results } }) => Promise.map(
    results, productType => client[service].byId(
      productType.id
    ).delete(
      productType.version
    )
  )
)

describe('productType import module', function productTypeTestFn () {
  this.timeout(100000)

  let client
  let productTypeImport

  beforeEach((done) => {
    console.log(getSphereClientCredentials)
    getSphereClientCredentials(PROJECT_KEY)
    .then((sphereCredentials) => {
      const options = {
        config: sphereCredentials,
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
      key: 'random-key',
      name: 'custom-product-type',
      description: 'Some cool description',
      attributes: [
        {
          name: 'breite',
          label: {
            de: 'Breite',
          },
          type: {
            name: 'number',
          },
          attributeConstraint: 'None',
          isRequired: false,
          isSearchable: false,
        },
        {
          name: 'farbe',
          label: {
            de: 'Farbe',
          },
          type: {
            name: 'ltext',
          },
          attributeConstraint: 'None',
          isRequired: false,
          isSearchable: false,
          inputHint: 'SingleLine',
        },
      ],
    }
    productTypeImport.importProductType(productType)
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0

      expect(actual).to.equal(expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
      .then(({ body: { results: productTypes } }) => {
        const _actual = productTypes.length
        const _expected = 1

        expect(_actual).to.equal(_expected)
        done()
      })
    })
    .catch((err) => {
      done(err)
    })
  })

  it('should add an attribute to an existing product type', (done) => {
    const productType = {
      key: 'random-key',
      name: 'custom-product-type',
      description: 'Some cool description',
      attributes: [
        {
          name: 'breite',
          label: {
            de: 'Breite',
          },
          type: {
            name: 'number',
          },
          attributeConstraint: 'None',
          isRequired: false,
          isSearchable: false,
        },
      ],
    }
    const updatedProductType = Object.assign({}, productType, {
      attributes: [{
        name: 'farbe',
        label: {
          de: 'Farbe',
        },
        type: {
          name: 'ltext',
        },
        attributeConstraint: 'None',
        isRequired: false,
        isSearchable: false,
        inputHint: 'SingleLine',
      }],
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
    .then(() => productTypeImport.importProductType(updatedProductType))
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0
      expect(actual).to.equal(expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const [importedProductType] = productTypes
      expect(importedProductType.attributes.map(a => a.name))
        .to.deep.equal(['breite', 'farbe'])
      done()
    })
    .catch(err => done(err))
  })
})
