const seed = require('./seed');

class Store {
  constructor() { this.reset(); }

  reset() {
    this.users = JSON.parse(JSON.stringify(seed.users));
    this.groups = JSON.parse(JSON.stringify(seed.groups));
    this.ous = JSON.parse(JSON.stringify(seed.ous));
    this.computers = JSON.parse(JSON.stringify(seed.computers));
    this.domainInfo = JSON.parse(JSON.stringify(seed.domainInfo));
    this.timedMemberships = []; // {group, userDN, expiresAt}
  }

  // Users
  findUser(sam) { return this.users.find(u => u.sAMAccountName === sam); }
  findUserByDN(dn) { return this.users.find(u => u.distinguishedName === dn); }

  // Groups
  findGroup(name) { return this.groups.find(g => g.sAMAccountName === name); }

  // Computers
  findComputer(name) { return this.computers.find(c => c.cn === name); }

  // Timed membership cleanup
  cleanExpired() {
    const now = new Date();
    this.timedMemberships = this.timedMemberships.filter(tm => {
      if (new Date(tm.expiresAt) <= now) {
        const group = this.findGroup(tm.group);
        if (group) group.members = group.members.filter(m => m !== tm.userDN);
        const user = this.findUserByDN(tm.userDN);
        if (user) user.memberOf = user.memberOf.filter(g => g !== group?.distinguishedName);
        return false;
      }
      return true;
    });
  }
}

module.exports = new Store();
