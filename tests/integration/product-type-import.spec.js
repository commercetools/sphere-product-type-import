import { SphereClient } from 'sphere-node-sdk'
import Promise from 'bluebird'
import test from 'tape'
import ProductTypeImport from 'index'
import getSphereClientCredentials from 'sphere-client-credentials'

let PROJECT_KEY

if (process.env.CI === 'true')
  PROJECT_KEY = process.env.SPHERE_PROJECT_KEY
else
  PROJECT_KEY = process.env.npm_config_projectkey

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

test(`productType import module
  should not import product type without key`, (t) => {
  t.timeoutAfter(10000)
  const productType = {
    name: 'custom-product-type',
    description: 1244,
    attributes: [],
  }
  before()
    .then(() =>
      productTypeImport.importProductType(productType)
    )
    .then(() => {
      t.end('Error - should throw validation error')
    })
    .catch((err) => {
      t.equal(
        err.message.includes(
          'Validation error on productType "custom-product-type"'
        ),
        true,
        'Importer should throw validation error'
      )

      return client.productTypes.where(`name="${productType.name}"`).fetch()
        .then(({ body: { results: productTypes } }) => {
          const _actual = productTypes.length

          t.equal(_actual, 0, 'ProductTypes should not be imported')
          t.end()
        })
    })
})

test(`productType import module
  should import a complete product type`, (t) => {
  t.timeoutAfter(10000)
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

      t.equal(actual, expected, 'There should be no error')
      return client.productTypes.where(`name="${productType.name}"`).fetch()
      .then(({ body: { results: productTypes } }) => {
        const _actual = productTypes.length
        const _expected = 1

        t.equal(_actual, _expected, 'ProductTypes count should be same')

        t.end()
      })
    })
    .catch(t.end)
  })
  .catch(t.end)
})

test(`productType import module
  should add an attribute to an existing product type`, (t) => {
  t.timeoutAfter(10000)
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

      t.equal(actual, expected, 'There should be no error')

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const actual = productTypes.length
      const expected = 1

      t.equal(actual, expected, 'ProductTypes count should be equal')
    })
    .then(() => productTypeImport.importProductType(updatedProductType))
    .then(() => {
      const summary = JSON.parse(productTypeImport.summaryReport())
      const actual = summary.errors.length
      const expected = 0
      t.equal(actual, expected, 'There should be no error')

      return client.productTypes.where(`name="${productType.name}"`).fetch()
    })
    .then(({ body: { results: productTypes } }) => {
      const [importedProductType] = productTypes
      t.equal(!!importedProductType, true, 'ProductType should be imported')
      const actual = importedProductType.attributes.map(a => a.name)
      const expected = ['width', 'color']
      t.deepEqual(actual, expected, 'Product attributes should be equal')
      t.end()
    })
  })
  .catch(t.end)
})
