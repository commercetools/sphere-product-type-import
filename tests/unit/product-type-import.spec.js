import cuid from 'cuid'
import sinon from 'sinon'
import { expect } from 'chai'
import { SphereClient } from 'sphere-node-sdk'
import ProductTypeImport from '../../src'

require('babel-core').transform('code', {
  plugins: ['transform-runtime'],
})

const PROJECT_KEY = 'sphere-node-product-type-import'

describe('product-type import module', () => {
  const options = {
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
  it('should be class', () => {
    const expected = 'function'
    const actual = typeof ProductTypeImport

    expect(actual).to.equal(expected)
  })

  it('should create a sphere client', () => {
    const importer = new ProductTypeImport(logger, options)
    const expected = SphereClient
    const actual = importer.client.constructor

    expect(actual).to.equal(expected)
  })

  it(`summaryReport should return no errors and no imported product-types
    if no product-types were imported`, () => {
    const importer = new ProductTypeImport(logger, options)
    const expected = { errors: [], inserted: [], successfullImports: 0 }
    const actual = JSON.parse(importer.summaryReport())

    expect(actual).to.deep.equal(expected)
  })

  it('processStream function should exist', () => {
    const importer = new ProductTypeImport(logger, options)
    const expected = 'function'
    const actual = typeof importer.processStream

    expect(actual).to.equal(expected)
  })

  it('processStream function should call it\'s callback', (done) => {
    const callback = sinon.spy()
    const importer = new ProductTypeImport(logger, options)

    importer.processStream([], callback)
    .then(() => {
      expect(callback.calledOnce).to.equal(true)
      done()
    })
  })

  it(`processStream function should call importProductType
  for each product-type in the given chunk`, (done) => {
    const mockImportProductType = sinon.spy(() => {})
    const callback = () => {}
    const productTypes = Array.from(new Array(10), () => ({ name: cuid() }))
    const importer = new ProductTypeImport(logger, options)
    sinon.stub(importer, 'importProductType', mockImportProductType)

    importer.processStream(productTypes, callback)
    .then(() => {
      const actual = mockImportProductType.callCount
      const expected = productTypes.length
      expect(expected).to.equal(actual)
      done()
    })
  })

  describe('validation method', () => {
    it('should resolve if the product-type object is valid', (done) => {
      const importer = new ProductTypeImport(logger, options)
      importer.validateProductType({ name: 'product-type', description: 'des' })
      .then(() => {
        done()
      })
    })

    it('should reject if the product-type object is invalid', (done) => {
      const importer = new ProductTypeImport(logger, options)
      importer.validateProductType({})
      .catch(() => {
        done()
      })
    })
  })

  describe('buildUpdateActions method', () => {
    it('should build actions for new attribute', () => {
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

      const actions = importer.buildUpdateActions(
        newProductType, existingProductType)

      expect(actions).to.deep.equal([
        {
          action: 'addAttributeDefinition',
          attribute: { name: 'a1' },
        },
        {
          action: 'addAttributeDefinition',
          attribute: { name: 'a3' },
        },
      ])
    })
  })

  describe('importProductType method', () => {
    let importer

    beforeEach(() => {
      importer = new ProductTypeImport(logger, options)
    })

    afterEach(() => {
    })

    it('should increase the successfullImports counter', (done) => {
      importer.importProductType(
        { name: 'product-type', description: 'some product type' }
      ).then(() => {
        const actual = importer.summary.successfullImports
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
      .catch(done)
    })

    it(`should push the error and the corresponding product-type
    to the errors array`, (done) => {
      importer.importProductType({})
      .then(() => {
        const actual = importer.summary.errors.length
        const expected = 1
        expect(actual).to.equal(expected)
        done()
      })
    })

    it('should handle existing product-types', (done) => {
      const error = {
        body: {
          errors: [{
            code: 'DuplicateField',
          }],
        },
      }
      const mockCustomerSave = () => Promise.reject(error)
      sinon.stub(importer.client.productTypes, 'save', mockCustomerSave)
      const productType = {
        name: 'product-type', description: 'some product type',
      }
      importer.importProductType(productType)
      .then(() => {
        const actual = importer.summary.errors[0]
        const expected = {
          productType,
          error,
        }
        expect(actual).to.deep.equal(expected)
        importer.client.productTypes.save.restore()
        done()
      })
    })

    it('should handle errors during creating a product-type', (done) => {
      const mockCustomerSave = () => Promise.reject({})
      sinon.stub(importer.client.productTypes, 'save', mockCustomerSave)
      const productType = {
        name: 'product-type', description: 'some product type',
      }
      importer.importProductType(productType)
      .then(() => {
        const actual = importer.summary.errors[0]
        const expected = {
          productType,
          error: {},
        }
        expect(actual).to.deep.equal(expected)
        importer.client.productTypes.save.restore()
        done()
      })
    })
  })
})
