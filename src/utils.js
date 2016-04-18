import { ProjectCredentialsConfig } from 'sphere-node-utils'

const getSphereClientCredentials = (projectKey) => {
  return ProjectCredentialsConfig.create()
  .then((credentials) => {
    const sphereCredentials = credentials.enrichCredentials({
      project_key: projectKey
    })
    return sphereCredentials
  })
}

export {
  getSphereClientCredentials
}
