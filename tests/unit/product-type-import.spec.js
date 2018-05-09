import cuid from 'cuid'
import test from 'tape'
import sinon from 'sinon'
import { SphereClient } from 'sphere-node-sdk'
import ProductTypeImport from 'index'
import getSphereClientCredentials from 'sphere-client-credentials'

const PROJECT_KEY = 'sphere-node-product-type-import'


const options = {
  importerConfig: {
    continueOnProblems: true,
  },
  sphereClientConfig: {
    config: {
      project_key: PROJECT_KEY,
      client_id: '*********',
      client_secret: '*********',
    },
    rest: {
      config: {},
      GET: (endpoint, callback) => {
        callback(null, { statusCode: 200 }, { results: [] })
      },
      POST: (endpoint, payload, callback) => {
        callback(null, { statusCode: 200 })
      },
      PUT: () => {},
      DELETE: () => (/* endpoint, callback */) => {},
      PAGED: () => (/* endpoint, callback */) => {},
      _preRequest: () => {},
      _doRequest: () => {},
    },
  },
}
/* eslint-disable no-console */
const logger = {
  trace: console.log,
  debug: console.log,
  info: console.log,
  error: console.error,
}
/* eslint-enable no-console */
test(`ProductTypeImport
  should be class`, (t) => {
  const expected = 'function'
  const actual = typeof ProductTypeImport
  t.equal(actual, expected, 'ProductTypeImport is a class')

  t.end()
})

test(`ProductTypeImport
  should create a sphere client`, (t) => {
  const importer = new ProductTypeImport(logger, options)
  const expected = SphereClient
  const actual = importer.client.constructor

  t.equal(actual, expected, 'ProductTypeImport is an instanceof SphereClient')

  t.end()
})

test(`summaryReport
  should return no errors and no imported product-types
  if no product-types were imported`, (t) => {
  const importer = new ProductTypeImport(logger, options)
  const expected = { errors: [], inserted: [], successfullImports: 0 }
  const actual = JSON.parse(importer.summaryReport())

  t.deepEqual(actual, expected, 'No errors if no import occurs')

  t.end()
})

test(`getSphereClientCredentials
  should throw an error is projectKey is not defined`, (t) => {
  getSphereClientCredentials(undefined)
    .then(() => {
      t.fail('should not resolve')
      t.end()
    })
    .catch((err) => {
      const expectedMsg = 'Project Key is needed'
      t.ok(err, 'Error should exist')
      t.equal(err.message, expectedMsg, 'Error message should be present')
      t.end()
    })
})

test(`processStream function
  should exist`, (t) => {
  const importer = new ProductTypeImport(logger, options)
  const expected = 'function'
  const actual = typeof importer.processStream

  t.equal(actual, expected, 'method is a valid function')

  t.end()
})

test(`processStream function
  should call it's callback`, (t) => {
  const callback = sinon.spy()
  const importer = new ProductTypeImport(logger, options)

  importer.processStream([], callback)
    .then(() => {
      t.ok(callback.calledOnce, 'ProductTypeImport is called once')

      t.end()
    })
})

test(`processStream function should
  call importProductType for each product-type in the given chunk`, (t) => {
  const mockImportProductType = sinon.spy(() => Promise.resolve())
  const callback = () => {}
  const productTypes = Array.from(new Array(10), () => ({ name: cuid() }))
  const importer = new ProductTypeImport(logger, options)
  sinon.stub(importer, 'importProductType').callsFake(mockImportProductType)

  importer.processStream(productTypes, callback)
    .then(() => {
      const actual = mockImportProductType.callCount
      const expected = productTypes.length

      t.equal(actual, expected, 'Product types count is equal')

      t.end()
    })
})

test(`validation method
  should resolve if the product-type object is valid`, (t) => {
  const importer = new ProductTypeImport(logger, options)
  importer.validateProductType({
    name: 'product-type',
    key: 'key',
    description: 'des',
  })
    .then(() => {
      t.end()
    })
})

test(`validation method
  should reject if the product-type object is invalid`, (t) => {
  const importer = new ProductTypeImport(logger, options)
  importer.validateProductType({})
    .catch(() => {
      t.end()
    })
})

test(`buildUpdateActions method
  should build actions for new attribute`, (t) => {
  const importer = new ProductTypeImport(logger, options)

  const newProductType = {
    attributes: [
      { name: 'a1' },
      { name: 'a2' },
      { name: 'a3' },
    ],
  }
  const existingProductType = {
    attributes: [
      { name: 'a2' },
    ],
  }

  const actual = importer.buildUpdateActions(
    newProductType,
    existingProductType,
  )
  const expected = [
    {
      action: 'addAttributeDefinition',
      attribute: { name: 'a1' },
    },
    {
      action: 'addAttributeDefinition',
      attribute: { name: 'a3' },
    },
  ]
  t.deepEqual(actual, expected, 'Update actions should be deepEqual')

  t.end()
})

const initProductTypeImport = function initProductTypeImport () {
  return new ProductTypeImport(logger, options)
}


test(`importProductType method
  should increase the successfullImports counter`, (t) => {
  const importer = initProductTypeImport()
  importer.importProductType({
    name: 'product-type',
    key: 'key',
    description: 'some product type',
  })
    .then(() => {
      const actual = importer.summary.successfullImports
      const expected = 1
      t.equal(actual, expected, 'One product should be imported successfully')

      t.end()
    })
    .catch(t.end)
})

test(`importProductType method
  should push the error and the
  corresponding product-type to the errors array`, (t) => {
  const importer = initProductTypeImport()
  importer.importProductType({})
    .then(() => {
      const actual = importer.summary.errors.length
      const expected = 1
      t.equal(actual, expected, 'Error should occur')

      t.end()
    }).catch(t.end)
})

test(`importProductType method
  should handle existing product-types`, (t) => {
  const importer = initProductTypeImport()
  const error = {
    body: {
      errors: [{
        code: 'DuplicateField',
      }],
    },
  }
  const mockCustomerSave = () => Promise.reject(error)
  sinon.stub(importer.client.productTypes, 'save').callsFake(mockCustomerSave)
  const productType = {
    name: 'product-type', key: 'key', description: 'some product type',
  }
  importer.importProductType(productType)
    .then(() => {
      const actual = importer.summary.errors[0]
      const expected = {
        productType,
        error,
      }
      t.deepEqual(
        actual,
        expected,
        'existing product types should be handled',
      )
      importer.client.productTypes.save.restore()
      t.end()
    }).catch(t.end)
})

test(`importProductType method
  should handle errors during creating a product-type`, (t) => {
  const importer = initProductTypeImport()
  const mockCustomerSave = () => Promise.reject({})
  sinon.stub(importer.client.productTypes, 'save').callsFake(mockCustomerSave)
  const productType = {
    name: 'product-type', key: 'key', description: 'some product type',
  }
  importer.importProductType(productType)
    .then(() => {
      const actual = importer.summary.errors[0]
      const expected = {
        productType,
        error: {},
      }
      t.deepEqual(actual, expected, 'there is no error')
      importer.client.productTypes.save.restore()
      t.end()
    }).catch(t.end)
})
