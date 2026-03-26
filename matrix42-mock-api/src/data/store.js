const seed = require('./seed');

const store = {
  tokens: [
    { apiToken: 'pamlab-dev-token', RawToken: null, ValidTo: null, UserName: 'api-user' }
  ],
  objects: {
    SPSUserClassBase: [...seed.employees],
    SPSAssetClassBase: [...seed.assets],
    SPSSoftwareType: [...seed.software],
    SPSActivityClassBase: [...seed.tickets],
    SPSScCategoryClassBase: [...seed.categories],
  },
  webhooks: [],
  accessRequests: [...seed.accessRequests],
  dataDefinitions: seed.dataDefinitions,
  // New collections
  assetAssignments: [...seed.assetAssignments],
  softwareInstallations: [...seed.softwareInstallations],
  ticketComments: [...seed.ticketComments],
  provisioningWorkflows: [...seed.provisioningWorkflows],
  workflowSteps: [...seed.workflowSteps],
  userGroupMappings: [...seed.userGroupMappings],
  assetCompliance: [...seed.assetCompliance],
};

module.exports = store;
