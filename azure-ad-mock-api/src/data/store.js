const { createSeedData } = require('./seed');

class Store {
  constructor() {
    this.reset();
  }

  reset() {
    const seed = createSeedData();
    this.users = JSON.parse(JSON.stringify(seed.users));
    this.groups = JSON.parse(JSON.stringify(seed.groups));
    this.servicePrincipals = JSON.parse(JSON.stringify(seed.servicePrincipals));
    this.conditionalAccessPolicies = JSON.parse(JSON.stringify(seed.conditionalAccessPolicies));
    this.roleDefinitions = JSON.parse(JSON.stringify(seed.roleDefinitions));
    this.roleAssignments = JSON.parse(JSON.stringify(seed.roleAssignments));
    this.roleEligibilityScheduleRequests = JSON.parse(
      JSON.stringify(seed.roleEligibilityScheduleRequests),
    );
    this.roleAssignmentScheduleRequests = JSON.parse(
      JSON.stringify(seed.roleAssignmentScheduleRequests),
    );
    this.tenant = JSON.parse(JSON.stringify(seed.tenant));
    this.devToken = seed.devToken;
    this.defaultServicePrincipal = JSON.parse(JSON.stringify(seed.defaultServicePrincipal));
    this.tokens = new Map();
  }

  findUser(identifier) {
    return this.users.find(
      (user) =>
        user.id === identifier ||
        user.userPrincipalName === identifier ||
        user.mail === identifier ||
        user.onPremisesSamAccountName === identifier,
    );
  }

  findGroup(identifier) {
    return this.groups.find(
      (group) =>
        group.id === identifier ||
        group.displayName === identifier ||
        group.mailNickname === identifier,
    );
  }

  findServicePrincipal(identifier) {
    return this.servicePrincipals.find(
      (servicePrincipal) =>
        servicePrincipal.id === identifier ||
        servicePrincipal.appId === identifier ||
        servicePrincipal.displayName === identifier,
    );
  }

  findRoleDefinition(identifier) {
    return this.roleDefinitions.find(
      (role) =>
        role.id === identifier ||
        role.displayName === identifier ||
        role.templateId === identifier,
    );
  }

  resolveDirectoryObject(id) {
    return this.findUser(id) || this.findServicePrincipal(id) || this.findGroup(id) || null;
  }
}

module.exports = new Store();
