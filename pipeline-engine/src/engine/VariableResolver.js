class VariableResolver {
  static resolve(value, context) {
    if (typeof value === 'string') {
      return VariableResolver._resolveString(value, context);
    }

    if (Array.isArray(value)) {
      return value.map((item) => VariableResolver.resolve(item, context));
    }

    if (value && typeof value === 'object') {
      const resolved = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        resolved[key] = VariableResolver.resolve(nestedValue, context);
      }
      return resolved;
    }

    return value;
  }

  static resolvePath(path, context) {
    return VariableResolver._getNestedValue(path, context);
  }

  static _resolveString(input, context) {
    const directMatch = input.match(/^\s*\{\{\s*([^}]+)\s*\}\}\s*$/);
    if (directMatch) {
      const directValue = VariableResolver._getNestedValue(directMatch[1].trim(), context);
      if (directValue === undefined) {
        console.warn(`[VariableResolver] Variable nicht aufgeloest: ${directMatch[1].trim()}`);
        return input;
      }
      return directValue;
    }

    return input.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      const value = VariableResolver._getNestedValue(expression.trim(), context);
      if (value === undefined) {
        console.warn(`[VariableResolver] Variable nicht aufgeloest: ${expression.trim()}`);
        return match;
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      return String(value);
    });
  }

  static _getNestedValue(path, context) {
    const tokens = VariableResolver._tokenize(path);
    let current = context;

    for (const token of tokens) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = current[token];
    }

    return current;
  }

  static _tokenize(path) {
    const segments = [];
    let current = '';
    let bracketDepth = 0;

    for (const char of String(path)) {
      if (char === '.' && bracketDepth === 0) {
        if (current) {
          segments.push(current);
          current = '';
        }
        continue;
      }

      if (char === '[') bracketDepth += 1;
      if (char === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      current += char;
    }

    if (current) {
      segments.push(current);
    }

    const tokens = [];
    const bracketPattern = /([^[\]]+)|\[(\d+|".*?"|'.*?')\]/g;

    segments.forEach((segment) => {
      const trimmed = segment.trim();
      let match;

      while ((match = bracketPattern.exec(trimmed)) !== null) {
        if (match[1]) {
          tokens.push(match[1].trim());
          continue;
        }

        const rawIndex = match[2];
        if (/^\d+$/.test(rawIndex)) {
          tokens.push(Number(rawIndex));
        } else {
          tokens.push(rawIndex.slice(1, -1));
        }
      }
    });

    return tokens;
  }
}

module.exports = VariableResolver;
