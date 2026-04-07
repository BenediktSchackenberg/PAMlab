const ConnectorRegistry = require('./ConnectorRegistry');
const ActiveDirectoryConnector = require('./active-directory');
const AzureAdConnector = require('./azure-ad');
const CyberArkConnector = require('./cyberark');
const FudoPamConnector = require('./fudo-pam');
const JsmConnector = require('./jsm');
const Matrix42EsmConnector = require('./matrix42-esm');
const RemedyConnector = require('./remedy');
const ServiceNowConnector = require('./servicenow');

function registerConnectorNames(registry, names, connector) {
  names.forEach((name) => registry.register(name, connector));
}

function createRegistry(env = process.env) {
  const registry = new ConnectorRegistry();

  const fudo = new FudoPamConnector(env.FUDO_URL || 'http://localhost:8443');
  const matrix42 = new Matrix42EsmConnector(env.M42_URL || 'http://localhost:8444');
  const activeDirectory = new ActiveDirectoryConnector(env.AD_URL || 'http://localhost:8445');
  const azureAd = new AzureAdConnector(env.AZURE_AD_URL || 'http://localhost:8452');
  const serviceNow = new ServiceNowConnector(env.SNOW_URL || 'http://localhost:8447');
  const jsm = new JsmConnector(env.JSM_URL || 'http://localhost:8448');
  const remedy = new RemedyConnector(env.REMEDY_URL || 'http://localhost:8449');
  const cyberArk = new CyberArkConnector(env.CYBERARK_URL || 'http://localhost:8450');

  registerConnectorNames(registry, ['fudo-pam', 'fudo'], fudo);
  registerConnectorNames(registry, ['matrix42-esm', 'matrix42'], matrix42);
  registerConnectorNames(registry, ['active-directory', 'ad'], activeDirectory);
  registerConnectorNames(registry, ['azure-ad', 'entra', 'entra-id'], azureAd);
  registerConnectorNames(registry, ['servicenow', 'service-now', 'snow'], serviceNow);
  registerConnectorNames(registry, ['jsm', 'jira'], jsm);
  registerConnectorNames(registry, ['remedy'], remedy);
  registerConnectorNames(registry, ['cyberark'], cyberArk);

  return registry;
}

module.exports = createRegistry;
