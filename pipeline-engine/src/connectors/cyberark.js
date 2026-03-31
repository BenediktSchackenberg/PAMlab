// =============================================================================
// CyberArk PVWA Connector — Anbindung an die CyberArk Mock API (:8450)
// =============================================================================

const BaseConnector = require('./BaseConnector');

class CyberArkConnector extends BaseConnector {
  constructor(baseUrl = 'http://localhost:8450') {
    super('cyberark', baseUrl);
    this.credentials = { username: 'Administrator', password: 'Cyberark1!' };
    this._defineActions();
  }

  _defineActions() {
    // --- Auth ---
    this.defineAction('auth.logon', {
      method: 'POST', path: '/api/auth/Cyberark/Logon',
      description: 'Login mit CyberArk-Zugangsdaten'
    });
    this.defineAction('auth.logoff', {
      method: 'POST', path: '/api/auth/Logoff',
      description: 'Session beenden'
    });

    // --- Safes ---
    this.defineAction('safes.list', {
      method: 'GET', path: '/api/Safes',
      description: 'Alle Safes auflisten'
    });
    this.defineAction('safes.get', {
      method: 'GET', path: '/api/Safes/{safeUrlId}',
      description: 'Safe nach ID'
    });
    this.defineAction('safes.create', {
      method: 'POST', path: '/api/Safes',
      description: 'Neuen Safe anlegen'
    });
    this.defineAction('safes.update', {
      method: 'PUT', path: '/api/Safes/{safeUrlId}',
      description: 'Safe aktualisieren'
    });
    this.defineAction('safes.delete', {
      method: 'DELETE', path: '/api/Safes/{safeUrlId}',
      description: 'Safe löschen'
    });
    this.defineAction('safes.list-members', {
      method: 'GET', path: '/api/Safes/{safeUrlId}/Members',
      description: 'Safe-Mitglieder auflisten'
    });
    this.defineAction('safes.add-member', {
      method: 'POST', path: '/api/Safes/{safeUrlId}/Members',
      description: 'Mitglied zu Safe hinzufügen'
    });
    this.defineAction('safes.remove-member', {
      method: 'DELETE', path: '/api/Safes/{safeUrlId}/Members/{memberName}',
      description: 'Mitglied aus Safe entfernen'
    });

    // --- Accounts ---
    this.defineAction('accounts.list', {
      method: 'GET', path: '/api/Accounts',
      description: 'Alle Accounts auflisten (mit Search/Filter)'
    });
    this.defineAction('accounts.get', {
      method: 'GET', path: '/api/Accounts/{id}',
      description: 'Account nach ID'
    });
    this.defineAction('accounts.create', {
      method: 'POST', path: '/api/Accounts',
      description: 'Neuen Account anlegen'
    });
    this.defineAction('accounts.update', {
      method: 'PUT', path: '/api/Accounts/{id}',
      description: 'Account aktualisieren'
    });
    this.defineAction('accounts.delete', {
      method: 'DELETE', path: '/api/Accounts/{id}',
      description: 'Account löschen'
    });
    this.defineAction('accounts.retrieve-password', {
      method: 'POST', path: '/api/Accounts/{id}/Password/Retrieve',
      description: 'Passwort abrufen (Checkout)'
    });
    this.defineAction('accounts.checkin', {
      method: 'POST', path: '/api/Accounts/{id}/CheckIn',
      description: 'Account wieder einchecken'
    });
    this.defineAction('accounts.change-password', {
      method: 'POST', path: '/api/Accounts/{id}/Change',
      description: 'Passwortänderung auslösen'
    });
    this.defineAction('accounts.verify-password', {
      method: 'POST', path: '/api/Accounts/{id}/Verify',
      description: 'Passwort-Verifikation auslösen'
    });
    this.defineAction('accounts.reconcile-password', {
      method: 'POST', path: '/api/Accounts/{id}/Reconcile',
      description: 'Passwort-Reconciliation auslösen'
    });

    // --- Platforms ---
    this.defineAction('platforms.list', {
      method: 'GET', path: '/api/Platforms',
      description: 'Alle Plattformen auflisten'
    });
    this.defineAction('platforms.get', {
      method: 'GET', path: '/api/Platforms/{platformId}',
      description: 'Plattform nach ID'
    });
    this.defineAction('platforms.activate', {
      method: 'POST', path: '/api/Platforms/{platformId}/Activate',
      description: 'Plattform aktivieren'
    });
    this.defineAction('platforms.deactivate', {
      method: 'POST', path: '/api/Platforms/{platformId}/Deactivate',
      description: 'Plattform deaktivieren'
    });

    // --- Users ---
    this.defineAction('users.list', {
      method: 'GET', path: '/api/Users',
      description: 'Alle Benutzer auflisten'
    });
    this.defineAction('users.get', {
      method: 'GET', path: '/api/Users/{id}',
      description: 'Benutzer nach ID'
    });
    this.defineAction('users.create', {
      method: 'POST', path: '/api/Users',
      description: 'Neuen Benutzer anlegen'
    });
    this.defineAction('users.update', {
      method: 'PUT', path: '/api/Users/{id}',
      description: 'Benutzer aktualisieren'
    });
    this.defineAction('users.delete', {
      method: 'DELETE', path: '/api/Users/{id}',
      description: 'Benutzer löschen'
    });
    this.defineAction('users.activate', {
      method: 'POST', path: '/api/Users/{id}/Activate',
      description: 'Benutzer aktivieren'
    });
    this.defineAction('users.deactivate', {
      method: 'POST', path: '/api/Users/{id}/Deactivate',
      description: 'Benutzer deaktivieren (suspendieren)'
    });
    this.defineAction('users.reset-password', {
      method: 'POST', path: '/api/Users/{id}/ResetPassword',
      description: 'Passwort zurücksetzen'
    });

    // --- Groups ---
    this.defineAction('groups.list', {
      method: 'GET', path: '/api/UserGroups',
      description: 'Alle Gruppen auflisten'
    });
    this.defineAction('groups.get', {
      method: 'GET', path: '/api/UserGroups/{id}',
      description: 'Gruppe nach ID'
    });
    this.defineAction('groups.create', {
      method: 'POST', path: '/api/UserGroups',
      description: 'Neue Gruppe anlegen'
    });
    this.defineAction('groups.update', {
      method: 'PUT', path: '/api/UserGroups/{id}',
      description: 'Gruppe aktualisieren'
    });
    this.defineAction('groups.delete', {
      method: 'DELETE', path: '/api/UserGroups/{id}',
      description: 'Gruppe löschen'
    });
    this.defineAction('groups.add-member', {
      method: 'POST', path: '/api/UserGroups/{id}/Members',
      description: 'Mitglied zu Gruppe hinzufügen'
    });
    this.defineAction('groups.remove-member', {
      method: 'DELETE', path: '/api/UserGroups/{id}/Members/{memberId}',
      description: 'Mitglied aus Gruppe entfernen'
    });

    // --- Sessions ---
    this.defineAction('sessions.list', {
      method: 'GET', path: '/api/LiveSessions',
      description: 'PSM Sessions auflisten'
    });
    this.defineAction('sessions.get', {
      method: 'GET', path: '/api/LiveSessions/{sessionId}',
      description: 'PSM Session nach ID'
    });
    this.defineAction('sessions.terminate', {
      method: 'POST', path: '/api/LiveSessions/{sessionId}/Terminate',
      description: 'PSM Session beenden'
    });

    // --- System Health ---
    this.defineAction('health.summary', {
      method: 'GET', path: '/api/ComponentsMonitoringDetails',
      description: 'System-Gesundheitsübersicht'
    });
    this.defineAction('health.component', {
      method: 'GET', path: '/api/ComponentsMonitoringDetails/{componentId}',
      description: 'Komponentenstatus abfragen'
    });

    // --- Server Info ---
    this.defineAction('server.info', {
      method: 'GET', path: '/api/Server',
      description: 'Server-Informationen'
    });
  }

  async authenticate() {
    const result = await this.execute('auth.logon', this.credentials);
    this.token = result;
    return result;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: this.token } : {};
  }
}

module.exports = CyberArkConnector;
