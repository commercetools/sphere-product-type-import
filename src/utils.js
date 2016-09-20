import { ProjectCredentialsConfig } from 'sphere-node-utils'

const getSphereClientCredentials = projectKey =>
  ProjectCredentialsConfig.create()
  .then((credentials) => {
    const sphereCredentials = credentials.enrichCredentials({
      project_key: projectKey,
    })
    return sphereCredentials
  })

export default getSphereClientCredentials
