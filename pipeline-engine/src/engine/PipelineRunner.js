const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');

const ConditionEvaluator = require('./ConditionEvaluator');
const RollbackHandler = require('./RollbackHandler');
const StepExecutor = require('./StepExecutor');
const VariableResolver = require('./VariableResolver');

const log = {
  info: (msg, meta = {}) =>
    console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), msg, ...meta })),
  warn: (msg, meta = {}) =>
    console.warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), msg, ...meta })),
  error: (msg, meta = {}) =>
    console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, ...meta })),
};

class PipelineRunner {
  constructor(registry) {
    this.registry = registry;
    this.stepExecutor = new StepExecutor(registry);
    this.rollbackHandler = new RollbackHandler(registry);
    this.runs = new Map();
  }

  async loadPipeline(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return this.validateDefinition(yaml.load(content), filePath);
  }

  validateDefinition(pipeline, source = 'unknown') {
    const normalized = this._normalizePipeline(pipeline);
    this._validatePipeline(normalized, source);
    return normalized;
  }

  _normalizePipeline(pipeline) {
    if (!pipeline || typeof pipeline !== 'object') {
      return pipeline;
    }

    const normalizeStep = (step) => {
      if (!step || typeof step !== 'object') {
        return step;
      }

      const normalized = { ...step };

      if (!normalized.system && normalized.connector) {
        normalized.system = normalized.connector;
      }

      if (Array.isArray(normalized.parallel)) {
        normalized.parallel = normalized.parallel.map(normalizeStep);
      }

      if (normalized.foreach && typeof normalized.foreach === 'object') {
        normalized.foreach = {
          ...normalized.foreach,
          steps: Array.isArray(normalized.foreach.steps)
            ? normalized.foreach.steps.map(normalizeStep)
            : normalized.foreach.steps,
        };
      }

      return normalized;
    };

    return {
      ...pipeline,
      steps: Array.isArray(pipeline.steps) ? pipeline.steps.map(normalizeStep) : pipeline.steps,
      rollback: Array.isArray(pipeline.rollback)
        ? pipeline.rollback.map(normalizeStep)
        : pipeline.rollback,
    };
  }

  _validatePipeline(pipeline, source = 'unknown') {
    const errors = [];

    if (!pipeline || typeof pipeline !== 'object') {
      throw new Error(
        `Pipeline-Validierung fehlgeschlagen (${source}):\n  - Ungueltiges Pipeline-Format`,
      );
    }

    if (!pipeline.name) {
      errors.push('Pipeline benoetigt ein "name" Feld');
    }

    if (!Array.isArray(pipeline.steps) || pipeline.steps.length === 0) {
      errors.push('Pipeline benoetigt ein nicht-leeres "steps" Array');
    } else {
      this._validateStepList(pipeline.steps, 'steps', errors);
    }

    if (pipeline.rollback !== undefined && !Array.isArray(pipeline.rollback)) {
      errors.push('"rollback" muss ein Array sein');
    } else if (Array.isArray(pipeline.rollback)) {
      this._validateStepList(pipeline.rollback, 'rollback', errors, { allowBlocks: false });
    }

    if (errors.length > 0) {
      throw new Error(
        `Pipeline-Validierung fehlgeschlagen (${source}):\n  - ${errors.join('\n  - ')}`,
      );
    }

    return { valid: true, errors: [] };
  }

  _validateStepList(steps, location, errors, options = {}) {
    const allowBlocks = options.allowBlocks !== false;

    steps.forEach((step, index) => {
      const label = step && step.name ? step.name : `${location}[${index}]`;

      if (!step || typeof step !== 'object') {
        errors.push(`${label}: Step muss ein Objekt sein`);
        return;
      }

      const hasParallel = Array.isArray(step.parallel);
      const hasForeach = step.foreach !== undefined;
      const isWait = step.action === 'wait' || step.wait !== undefined;

      if ((hasParallel && hasForeach) || (hasParallel && isWait) || (hasForeach && isWait)) {
        errors.push(`${label}: Ein Step darf nur einen Modus verwenden`);
        return;
      }

      if (hasParallel) {
        if (!allowBlocks) {
          errors.push(`${label}: Kontrollstrukturen sind hier nicht erlaubt`);
          return;
        }

        if (step.parallel.length === 0) {
          errors.push(`${label}: "parallel" benoetigt mindestens einen Step`);
          return;
        }

        this._validateStepList(step.parallel, `${label}.parallel`, errors, options);
        return;
      }

      if (hasForeach) {
        if (!allowBlocks) {
          errors.push(`${label}: Kontrollstrukturen sind hier nicht erlaubt`);
          return;
        }

        if (!step.foreach || typeof step.foreach !== 'object') {
          errors.push(`${label}: "foreach" muss ein Objekt sein`);
          return;
        }

        if (step.foreach.items === undefined) {
          errors.push(`${label}: "foreach.items" fehlt`);
        }

        if (!Array.isArray(step.foreach.steps) || step.foreach.steps.length === 0) {
          errors.push(`${label}: "foreach.steps" benoetigt mindestens einen Step`);
          return;
        }

        this._validateStepList(step.foreach.steps, `${label}.foreach.steps`, errors, options);
        return;
      }

      if (isWait) {
        return;
      }

      if (!step.system) {
        errors.push(`${label}: "system" fehlt`);
      }

      if (!step.action) {
        errors.push(`${label}: "action" fehlt`);
      }
    });
  }

  async validate(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const pipeline = this.validateDefinition(yaml.load(content), filePath);
      return {
        valid: true,
        name: pipeline.name,
        steps: this._countSteps(pipeline.steps),
        errors: [],
      };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  async run(filePath, vars = {}, options = {}) {
    const runId = uuidv4();
    const pipeline = await this.loadPipeline(filePath);
    const dryRun = options.dryRun || false;

    log.info('Pipeline started', {
      pipeline: pipeline.name,
      runId,
      mode: dryRun ? 'dry-run' : 'live',
    });

    const context = {
      trigger: { ...(pipeline.trigger || {}), ...vars },
      vars: { ...vars },
      steps: {},
      loop: null,
      run: {
        id: runId,
        pipeline: pipeline.name,
        startedAt: new Date().toISOString(),
      },
    };

    const run = {
      id: runId,
      pipeline: pipeline.name,
      pipelineFile: filePath,
      status: 'running',
      dryRun,
      startedAt: new Date().toISOString(),
      completedAt: null,
      vars,
      steps: [],
      rollback: null,
    };

    this.runs.set(runId, run);

    const execution = await this._executeStepList(pipeline.steps, context, { dryRun, runId });
    run.steps = execution.results;

    if (execution.failed) {
      log.error(`Step failed: ${execution.failed.qualifiedName}`, {
        error: execution.failed.error,
        runId,
      });

      run.status = 'failed';
      run.failedAt = execution.failed.qualifiedName;

      if (pipeline.rollback && pipeline.rollback.length > 0) {
        const rollbackResults = await this.rollbackHandler.execute(
          pipeline.rollback,
          context,
          execution.failedIndex,
        );
        run.rollback = rollbackResults;
      }

      run.completedAt = new Date().toISOString();
      return run;
    }

    run.status = 'completed';
    run.completedAt = new Date().toISOString();

    const durationMs = new Date(run.completedAt) - new Date(run.startedAt);
    log.info('Pipeline completed', { pipeline: pipeline.name, runId, durationMs });

    return run;
  }

  async listPipelines(pipelinesDir) {
    const dir = pipelinesDir || path.join(__dirname, '../../pipelines');

    try {
      await fs.promises.access(dir);
    } catch {
      return [];
    }

    const files = await fs.promises.readdir(dir);
    const results = [];

    for (const fileName of files.filter((entry) => entry.endsWith('.yaml') || entry.endsWith('.yml'))) {
      try {
        const fullPath = path.join(dir, fileName);
        const content = await fs.promises.readFile(fullPath, 'utf8');
        const pipeline = this.validateDefinition(yaml.load(content), fullPath);
        results.push({
          file: fileName,
          name: pipeline.name || fileName,
          description: pipeline.description || '',
          steps: this._countSteps(pipeline.steps),
          hasRollback: !!(pipeline.rollback && pipeline.rollback.length > 0),
        });
      } catch {
        results.push({ file: fileName, name: fileName, error: 'Parsing fehlgeschlagen' });
      }
    }

    return results;
  }

  getRuns(limit = 50) {
    return Array.from(this.runs.values())
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);
  }

  getRun(runId) {
    return this.runs.get(runId) || null;
  }

  async _executeStepList(steps, context, options, scope = '') {
    const results = [];

    for (let index = 0; index < steps.length; index += 1) {
      const step = steps[index];
      const result = await this._executeStep(step, context, options, scope);
      results.push(result);

      if (result.status === 'failed') {
        return { results, failed: result, failedIndex: index };
      }
    }

    return { results, failed: null, failedIndex: -1 };
  }

  async _executeStep(step, context, options, scope = '') {
    const startedAt = Date.now();
    const stepName = step.name || this._defaultStepName(step);
    const qualifiedName = scope ? `${scope} / ${stepName}` : stepName;
    const stepType = this._getStepType(step);

    if (!ConditionEvaluator.evaluate(step.condition, context)) {
      const skipped = {
        name: stepName,
        qualifiedName,
        type: stepType,
        status: 'skipped',
        reason: 'condition-false',
        durationMs: Date.now() - startedAt,
      };
      context.steps[qualifiedName] = skipped;
      return skipped;
    }

    if (Array.isArray(step.parallel)) {
      return this._executeParallelStep(step, context, options, qualifiedName, stepName, startedAt);
    }

    if (step.foreach) {
      return this._executeForeachStep(step, context, options, qualifiedName, stepName, startedAt);
    }

    log.info(`Executing step`, {
      step: qualifiedName,
      runId: options.runId,
      type: stepType,
    });

    const result = await this.stepExecutor.execute(step, context, options.dryRun);
    const enriched = {
      name: stepName,
      qualifiedName,
      type: stepType,
      ...result,
    };

    context.steps[qualifiedName] = enriched;

    if (enriched.status === 'success') {
      log.info(`Step completed`, {
        step: qualifiedName,
        durationMs: enriched.durationMs,
        runId: options.runId,
      });
    }

    return enriched;
  }

  async _executeParallelStep(step, context, options, qualifiedName, stepName, startedAt) {
    const branchRuns = await Promise.all(
      step.parallel.map(async (branchStep) => {
        const branchContext = this._cloneContext(context);
        const branchResult = await this._executeStep(branchStep, branchContext, options, qualifiedName);
        return { branchContext, branchResult };
      }),
    );

    branchRuns.forEach(({ branchContext }) => this._mergeContextSteps(context, branchContext));

    const branches = branchRuns.map(({ branchResult }) => branchResult);
    const failedBranch = branches.find((branch) => branch.status === 'failed');
    const summary = this._summarizeNestedResults(branches);

    const result = {
      name: stepName,
      qualifiedName,
      type: 'parallel',
      status: failedBranch ? 'failed' : summary.success > 0 ? 'success' : 'skipped',
      branches,
      result: summary,
      error: failedBranch ? failedBranch.error : undefined,
      durationMs: Date.now() - startedAt,
    };

    context.steps[qualifiedName] = result;
    return result;
  }

  async _executeForeachStep(step, context, options, qualifiedName, stepName, startedAt) {
    const items = VariableResolver.resolve(step.foreach.items, context);
    if (!Array.isArray(items)) {
      const failed = {
        name: stepName,
        qualifiedName,
        type: 'foreach',
        status: 'failed',
        error: `"foreach.items" muss zu einem Array aufgeloest werden`,
        durationMs: Date.now() - startedAt,
      };
      context.steps[qualifiedName] = failed;
      return failed;
    }

    const alias = step.foreach.as || 'item';
    const iterations = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const iterationContext = this._cloneContext(context);
      const iterationScope = `${qualifiedName} / ${alias} ${index + 1}`;

      iterationContext.loop = {
        item,
        index,
        position: index + 1,
        total: items.length,
        [alias]: item,
      };
      iterationContext.vars = {
        ...iterationContext.vars,
        [alias]: item,
        [`${alias}Index`]: index,
        [`${alias}Position`]: index + 1,
      };

      const execution = await this._executeStepList(
        step.foreach.steps,
        iterationContext,
        options,
        iterationScope,
      );

      this._mergeContextSteps(context, iterationContext);

      const iterationResult = {
        index,
        item,
        status: execution.failed ? 'failed' : this._summarizeNestedResults(execution.results).success > 0 ? 'success' : 'skipped',
        steps: execution.results,
      };

      iterations.push(iterationResult);

      if (execution.failed) {
        const failed = {
          name: stepName,
          qualifiedName,
          type: 'foreach',
          status: 'failed',
          iterations,
          result: {
            totalItems: items.length,
            completedIterations: iterations.length,
          },
          error: execution.failed.error,
          durationMs: Date.now() - startedAt,
        };
        context.steps[qualifiedName] = failed;
        return failed;
      }
    }

    const succeededIterations = iterations.filter((entry) => entry.status === 'success').length;
    const result = {
      name: stepName,
      qualifiedName,
      type: 'foreach',
      status: succeededIterations > 0 || items.length === 0 ? 'success' : 'skipped',
      iterations,
      result: {
        totalItems: items.length,
        completedIterations: iterations.length,
        succeededIterations,
      },
      durationMs: Date.now() - startedAt,
    };

    context.steps[qualifiedName] = result;
    return result;
  }

  _cloneContext(context) {
    return JSON.parse(JSON.stringify(context));
  }

  _mergeContextSteps(targetContext, sourceContext) {
    targetContext.steps = {
      ...targetContext.steps,
      ...sourceContext.steps,
    };
  }

  _countSteps(steps) {
    return steps.reduce((count, step) => {
      if (Array.isArray(step.parallel)) {
        return count + this._countSteps(step.parallel);
      }

      if (step.foreach && Array.isArray(step.foreach.steps)) {
        return count + this._countSteps(step.foreach.steps);
      }

      return count + 1;
    }, 0);
  }

  _defaultStepName(step) {
    if (Array.isArray(step.parallel)) {
      return 'parallel';
    }

    if (step.foreach) {
      return 'foreach';
    }

    if (step.action === 'wait' || step.wait !== undefined) {
      return 'wait';
    }

    if (step.system && step.action) {
      return `${step.system}.${step.action}`;
    }

    return 'step';
  }

  _getStepType(step) {
    if (Array.isArray(step.parallel)) {
      return 'parallel';
    }

    if (step.foreach) {
      return 'foreach';
    }

    if (step.action === 'wait' || step.wait !== undefined) {
      return 'wait';
    }

    return 'action';
  }

  _summarizeNestedResults(results) {
    return results.reduce(
      (summary, result) => {
        summary.total += 1;
        if (result.status === 'success') summary.success += 1;
        if (result.status === 'failed') summary.failed += 1;
        if (result.status === 'skipped') summary.skipped += 1;
        return summary;
      },
      { total: 0, success: 0, failed: 0, skipped: 0 },
    );
  }
}

module.exports = PipelineRunner;
