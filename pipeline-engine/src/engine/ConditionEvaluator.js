const VariableResolver = require('./VariableResolver');

class ConditionEvaluator {
  static evaluate(condition, context) {
    if (condition === undefined) {
      return true;
    }

    if (typeof condition === 'boolean') {
      return condition;
    }

    if (typeof condition === 'string') {
      return ConditionEvaluator._isTruthy(VariableResolver.resolve(condition, context));
    }

    if (Array.isArray(condition)) {
      return condition.every((entry) => ConditionEvaluator.evaluate(entry, context));
    }

    if (!condition || typeof condition !== 'object') {
      return Boolean(condition);
    }

    if (Array.isArray(condition.all)) {
      return condition.all.every((entry) => ConditionEvaluator.evaluate(entry, context));
    }

    if (Array.isArray(condition.any)) {
      return condition.any.some((entry) => ConditionEvaluator.evaluate(entry, context));
    }

    if (condition.not !== undefined) {
      return !ConditionEvaluator.evaluate(condition.not, context);
    }

    if (condition.exists !== undefined) {
      const value = VariableResolver.resolve(condition.exists, context);
      return value !== undefined && value !== null && !ConditionEvaluator._isUnresolvedTemplate(value);
    }

    if (condition.truthy !== undefined) {
      return ConditionEvaluator._isTruthy(VariableResolver.resolve(condition.truthy, context));
    }

    if (condition.falsy !== undefined) {
      return !ConditionEvaluator._isTruthy(VariableResolver.resolve(condition.falsy, context));
    }

    const leftValue = VariableResolver.resolve(
      condition.left !== undefined ? condition.left : condition.value,
      context,
    );

    if (condition.equals !== undefined) {
      return ConditionEvaluator._compare(
        leftValue,
        VariableResolver.resolve(condition.equals, context),
      );
    }

    if (condition.notEquals !== undefined) {
      return !ConditionEvaluator._compare(
        leftValue,
        VariableResolver.resolve(condition.notEquals, context),
      );
    }

    if (condition.gt !== undefined) {
      return Number(leftValue) > Number(VariableResolver.resolve(condition.gt, context));
    }

    if (condition.gte !== undefined) {
      return Number(leftValue) >= Number(VariableResolver.resolve(condition.gte, context));
    }

    if (condition.lt !== undefined) {
      return Number(leftValue) < Number(VariableResolver.resolve(condition.lt, context));
    }

    if (condition.lte !== undefined) {
      return Number(leftValue) <= Number(VariableResolver.resolve(condition.lte, context));
    }

    if (condition.in !== undefined) {
      const haystack = VariableResolver.resolve(condition.in, context);
      if (!Array.isArray(haystack)) {
        return false;
      }
      return haystack.some((entry) => ConditionEvaluator._compare(entry, leftValue));
    }

    if (condition.contains !== undefined) {
      const needle = VariableResolver.resolve(condition.contains, context);
      if (Array.isArray(leftValue)) {
        return leftValue.some((entry) => ConditionEvaluator._compare(entry, needle));
      }
      return String(leftValue).includes(String(needle));
    }

    return ConditionEvaluator._isTruthy(leftValue);
  }

  static _isTruthy(value) {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      if (ConditionEvaluator._isUnresolvedTemplate(value)) {
        return false;
      }
      const normalized = value.trim().toLowerCase();
      return !['', 'false', '0', 'null', 'undefined', 'no'].includes(normalized);
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }

  static _compare(left, right) {
    if (typeof left === 'object' || typeof right === 'object') {
      return JSON.stringify(left) === JSON.stringify(right);
    }

    return left === right;
  }

  static _isUnresolvedTemplate(value) {
    return typeof value === 'string' && /\{\{\s*[^}]+\s*\}\}/.test(value);
  }
}

module.exports = ConditionEvaluator;
