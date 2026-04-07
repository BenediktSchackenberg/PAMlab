// =============================================================================
// BaseConnector — Basis-Klasse für alle System-Connectors
// =============================================================================

class BaseConnector {
  /**
   * @param {string} name - Connector-Name (z.B. 'fudo-pam')
   * @param {string} baseUrl - Basis-URL des Zielsystems
   */
  constructor(name, baseUrl) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.token = null;
    this.actions = {};
  }

  /**
   * Definiert eine Action mit HTTP-Methode, Pfad und Parameterschema
   */
  defineAction(actionName, { method, path, params = {}, description = '' }) {
    this.actions[actionName] = { method, path, params, description };
  }

  /**
   * Authentifizierung — wird von Subklassen überschrieben
   */
  async authenticate() {
    throw new Error(`authenticate() nicht implementiert für ${this.name}`);
  }

  /**
   * Führt eine Action aus
   * @param {string} actionName - z.B. 'users.list'
   * @param {object} params - Parameter für die Action
   * @param {boolean} dryRun - Nur simulieren, nicht ausführen
   */
  async execute(actionName, params = {}, dryRun = false) {
    const action = this.actions[actionName];
    if (!action) {
      throw new Error(
        `Action "${actionName}" nicht gefunden in ${this.name}. Verfügbar: ${Object.keys(this.actions).join(', ')}`,
      );
    }

    // Auto-Authentifizierung beim ersten Aufruf
    if (!this.token && !actionName.startsWith('auth.')) {
      await this.authenticate();
    }

    // Pfad-Parameter substituieren: /users/{id} → /users/123
    const usedPathParams = new Set();
    let url = `${this.baseUrl}${action.path}`.replace(/\{(\w+)\}/g, (match, key) => {
      if (params[key] === undefined || params[key] === null) {
        throw new Error(`Pfad-Parameter "${key}" fehlt für ${this.name}.${actionName}`);
      }
      usedPathParams.add(key);
      return encodeURIComponent(params[key]);
    });

    const remainingParams = Object.fromEntries(
      Object.entries(params).filter(
        ([key, value]) => !usedPathParams.has(key) && value !== undefined && value !== null,
      ),
    );

    const upperMethod = action.method.toUpperCase();
    if (['GET', 'DELETE', 'HEAD'].includes(upperMethod) && Object.keys(remainingParams).length > 0) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(remainingParams)) {
        if (Array.isArray(value)) {
          value.forEach((item) => query.append(key, String(item)));
        } else if (typeof value === 'object') {
          query.set(key, JSON.stringify(value));
        } else {
          query.set(key, String(value));
        }
      }
      const queryString = query.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }

    if (dryRun) {
      return {
        dryRun: true,
        connector: this.name,
        action: actionName,
        method: upperMethod,
        url,
        params: remainingParams,
      };
    }

    // Body nur bei POST/PUT/PATCH
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(upperMethod);
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
    };

    const fetchOptions = {
      method: upperMethod,
      headers,
    };

    if (hasBody) {
      fetchOptions.body = JSON.stringify(remainingParams);
    }

    const response = await fetch(url, fetchOptions);
    const rawBody = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let data = rawBody;

    if (contentType.includes('application/json') && rawBody) {
      data = JSON.parse(rawBody);
    } else if (!rawBody) {
      data = null;
    } else if (contentType.includes('text/plain')) {
      data = rawBody;
    } else {
      try {
        data = JSON.parse(rawBody);
      } catch {
        data = rawBody;
      }
    }

    if (!response.ok) {
      throw new Error(
        `${this.name}.${actionName} fehlgeschlagen (${response.status}): ${JSON.stringify(data)}`,
      );
    }

    return data;
  }

  /**
   * Auth-Headers — wird von Subklassen überschrieben
   */
  getAuthHeaders() {
    return {};
  }
}

module.exports = BaseConnector;
