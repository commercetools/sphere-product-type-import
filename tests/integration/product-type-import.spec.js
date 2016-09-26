import { SphereClient } from 'sphere-node-sdk'
import Promise from 'bluebird'
import test from 'tape'
import ProductTypeImport from '../../src'
import getSphereClientCredentials from '../../src/utils'

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

let client
let productTypeImport

const before = function setupSphereCreds () {
  return getSphereClientCredentials(PROJECT_KEY)
  .then((sphereCredentials) => {
    const options = {
      config: sphereCredentials,
    }
    client = new SphereClient(options)

    productTypeImport = new ProductTypeImport(
      logger,
      { sphereClientConfig: options }
    )
    return deleteAll('productTypes', client)
  })
}

test('productType import module should import a complete product type', (t) => {
  t.timeoutAfter(100000)
  before().then(() => {
    const productType = {
      key: 'random-key',
      name: 'custom-product-type',
      description: 'Some cool description',
      attributes: [
        {
          name: 'width',
          label: {
            de: 'Width',
          },
          type: {
            name: 'number',
          },
          attributeConstraint: 'None',
          isRequired: false,
          isSearchable: false,
        },
        {
          name: 'color',
          label: {
            de: 'Color',
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

      t.equal(actual, expected)
      return client.productTypes.where(`name="${productType.name}"`).fetch()
      .then(({ body: { results: productTypes } }) => {
        const _actual = productTypes.length
        const _expected = 1

        t.equal(_actual, _expected)

        t.end()
      })
    })
    .catch(t.end)
  })
  .catch(t.end)
})

test('productType import module should add an attribute' +
      'to an existing product type', (t) => {
  t.timeoutAfter(100000)
  before().then(() => {
    const productType = {
      key: 'random-key',
      name: 'custom-product-type',
      description: 'Some cool description',
      attributes: [
        {
          name: 'width',
          label: {
            de: 'Width',
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
        name: 'color',
        label: {
          de: 'Color',
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

      t.equal(actual, expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const actual = productTypes.length
      const expected = 1

      t.equal(actual, expected)
    })
    .then(() => productTypeImport.importProductType(updatedProductType))
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0
      t.equal(actual, expected)

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const [importedProductType] = productTypes
      const actual = importedProductType.attributes.map(a => a.name)
      const expected = ['width', 'color']
      t.deepEqual(actual, expected)
      t.end()
    })
    .catch(t.end)
  })
})
