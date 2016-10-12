import { ProjectCredentialsConfig } from 'sphere-node-utils'
import Promise from 'bluebird'

const getSphereClientCredentials = (projectKey) => {
  if (!projectKey)
    return Promise.reject(new Error('Project Key is needed'))
  return ProjectCredentialsConfig.create()
  .then((credentials) => {
    const sphereCredentials = credentials.enrichCredentials({
      project_key: projectKey,
    })
    return sphereCredentials
  })
}

export default getSphereClientCredentials
