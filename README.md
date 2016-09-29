[![commercetools logo][commercetools-icon]][commercetools]
# sphere-product-type-import

[![Travis][travis-badge]][travis-url]
[![Codecov][codecov-badge]][codecov-url]
[![npm][npm-lic-badge]][npm-lic-url]
[![semantic-release][semantic-release-badge]][semantic-release-url]
[![Commitizen friendly][commitizen-badge]][commitizen-url]
[![NPM version][npm-image]][npm-url]

A library that helps with importing [product-types](http://dev.commercetools.com/http-api-projects-productTypes.html) into the [Commercetools Platform](http://www.commercetools.com/).  
This library is built to be used in conjunction with [sphere-node-cli](https://github.com/sphereio/sphere-node-cli).

Table of Contents
=================

  * [Features](#features)
  * [Configuration](#configuration)
  * [Usage with sphere-node-cli](#usage-with-sphere-node-cli)
    * [Usage with sphere-node-cli](#usage-with-sphere-node-cli-1)
    * [Direct usage](#direct-usage)
  * [Contributing](#contributing)

## Features
- Import product types to your CTP project
- Pre-validate product types using a [JSON schema](https://github.com/sphereio/sphere-product-type-import/blob/master/src/product-type-import.js#L7)

## Configuration
The configuration object may contain:
- `sphereClientConfig`: see the [sphere-node-sdk docs](http://sphereio.github.io/sphere-node-sdk/) for more information on this

## Usage with `sphere-node-cli`

### Usage with `sphere-node-cli`

You can use the product type import from the command line using the [`sphere-node-cli`](https://github.com/sphereio/sphere-node-cli).
In order for the cli to import product types, the file to import from must be JSON and follow the this structure:
```
{
  "productTypes": [
    <product-type>,
    <product-type>,
    ...
  ]
}
```
Then you can import this file using the cli:
```
sphere-node-cli -t productType -p my-project-key -f /sample_dir/productTypes.json
```
You can pass a custom configuration as described above via the `-c` operator followed by a JSON String that represents your configuration

### Direct usage

If you want more control, you can also use this library directly in JavaScript. To do this you first need to install it:
```
npm install sphere-product-type-import --save-dev
```
Then you can use it to import product types like so:
```
import ProductTypeImport from 'sphere-product-type-import'

const productType = {
  name: '<some-name>',
  description: '<some-description>'
}
const config = {
  sphereClientConfig: {
    config: {
      project_key: <PROJECT_KEY>,
      client_id: '*********',
      client_secret: '*********'
    }
  }
}
const productTypeImport = ProductTypeImport(config)

productTypeImport.importProductType(productType)
.then(() => {
  // done importing the productType
  // look at the summary to see errors
  productTypeImport.summary
  // the summary hast the following structure
  // {
  //   errors: [],
  //   inserted: [<some-name>],
  //   successfulImports: 1
  // }
})
```
## Contributing
  See [CONTRIBUTING.md](CONTRIBUTING.md) file for info on how to contribute to this library
[commercetools]: https://commercetools.com/
[commercetools-icon]: https://cdn.rawgit.com/commercetools/press-kit/master/PNG/72DPI/CT%20logo%20horizontal%20RGB%2072dpi.png

[travis-badge]: https://img.shields.io/travis/sphereio/sphere-product-type-import.svg?style=flat-square
[travis-url]: https://travis-ci.org/sphereio/sphere-product-type-import

[codecov-badge]: https://img.shields.io/codecov/c/github/sphereio/sphere-product-type-import.svg?style=flat-square
[codecov-url]: https://codecov.io/github/sphereio/sphere-product-type-import

[npm-lic-badge]: https://img.shields.io/npm/l/sphere-product-type-import.svg?style=flat-square
[npm-lic-url]: http://spdx.org/licenses/MIT

[semantic-release-badge]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square
[semantic-release-url]: https://github.com/semantic-release/semantic-release

[commitizen-badge]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square
[commitizen-url]: http://commitizen.github.io/cz-cli/

[npm-url]: https://npmjs.org/package/sphere-product-type-import
[npm-image]: http://img.shields.io/npm/v/sphere-product-type-import.svg?style=flat-square
[npm-downloads-image]: https://img.shields.io/npm/dt/sphere-product-type-import.svg?style=flat-square
