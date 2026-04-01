// =============================================================================
// PipelineRunner — Lädt YAML-Pipelines und führt Steps sequenziell aus
// =============================================================================

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');
const StepExecutor = require('./StepExecutor');
const RollbackHandler = require('./RollbackHandler');

const log = {
  info: (msg, meta = {}) =>
    console.log(JSON.stringify({ level: 'info', ts: new Date().toISOString(), msg, ...meta })),
  warn: (msg, meta = {}) =>
    console.warn(JSON.stringify({ level: 'warn', ts: new Date().toISOString(), msg, ...meta })),
  error: (msg, meta = {}) =>
    console.error(JSON.stringify({ level: 'error', ts: new Date().toISOString(), msg, ...meta })),
};

class PipelineRunner {
  /**
   * @param {ConnectorRegistry} registry - Connector-Registry
   */
  constructor(registry) {
    this.registry = registry;
    this.stepExecutor = new StepExecutor(registry);
    this.rollbackHandler = new RollbackHandler(registry);
    this.runs = new Map(); // Run-History
  }

  /**
   * Lädt eine Pipeline-Definition aus einer YAML-Datei
   * @param {string} filePath - Pfad zur YAML-Datei
   * @returns {object} Pipeline-Definition
   */
  async loadPipeline(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    return this.validateDefinition(yaml.load(content), filePath);
  }

  /**
   * Normalisiert Legacy-Felder auf das aktuelle Pipeline-Schema
   */
  _normalizePipeline(pipeline) {
    if (!pipeline || typeof pipeline !== 'object') return pipeline;

    const normalizeStep = (step) => {
      if (!step || typeof step !== 'object') return step;
      if (step.system || !step.connector) return step;
      return { ...step, system: step.connector };
    };

    return {
      ...pipeline,
      steps: Array.isArray(pipeline.steps) ? pipeline.steps.map(normalizeStep) : pipeline.steps,
      rollback: Array.isArray(pipeline.rollback)
        ? pipeline.rollback.map(normalizeStep)
        : pipeline.rollback,
    };
  }

  /**
   * Validiert und normalisiert eine geladene Pipeline-Definition
   */
  validateDefinition(pipeline, source = 'unknown') {
    const normalized = this._normalizePipeline(pipeline);
    this._validatePipeline(normalized, source);
    return normalized;
  }

  /**
   * Validiert eine Pipeline-Definition
   */
  _validatePipeline(pipeline, source = 'unknown') {
    const errors = [];

    if (!pipeline || typeof pipeline !== 'object') {
      throw new Error(
        `Pipeline-Validierung fehlgeschlagen (${source}):\n  - Ungültiges Pipeline-Format`,
      );
    }

    if (!pipeline.name) errors.push('Pipeline benötigt ein "name" Feld');
    if (!pipeline.steps || !Array.isArray(pipeline.steps)) {
      errors.push('Pipeline benötigt ein "steps" Array');
    } else {
      pipeline.steps.forEach((step, i) => {
        if (!step.name) errors.push(`Step ${i + 1}: "name" fehlt`);
        if (!step.system && step.action !== 'wait' && !step.wait) {
          errors.push(`Step ${i + 1} (${step.name || '?'}): "system" fehlt`);
        }
        if (!step.action && !step.wait) {
          errors.push(`Step ${i + 1} (${step.name || '?'}): "action" fehlt`);
        }
      });
    }

    if (pipeline.rollback && !Array.isArray(pipeline.rollback)) {
      errors.push('"rollback" muss ein Array sein');
    }

    if (errors.length > 0) {
      throw new Error(
        `Pipeline-Validierung fehlgeschlagen (${source}):\n  - ${errors.join('\n  - ')}`,
      );
    }

    return { valid: true, errors: [] };
  }

  /**
   * Validiert eine Pipeline und gibt Ergebnis zurück (ohne Exception)
   */
  async validate(filePath) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf8');
      const pipeline = this.validateDefinition(yaml.load(content), filePath);
      return { valid: true, name: pipeline.name, steps: pipeline.steps.length, errors: [] };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Führt eine Pipeline aus
   * @param {string} filePath - Pfad zur YAML-Datei
   * @param {object} vars - Variablen (z.B. { user: 'j.doe', group: 'Admins' })
   * @param {object} options - Optionen (dryRun, etc.)
   * @returns {object} Run-Ergebnis
   */
  async run(filePath, vars = {}, options = {}) {
    const runId = uuidv4();
    const pipeline = await this.loadPipeline(filePath);
    const dryRun = options.dryRun || false;

    log.info('Pipeline started', {
      pipeline: pipeline.name,
      runId,
      mode: dryRun ? 'dry-run' : 'live',
    });

    // Laufzeit-Kontext aufbauen
    const context = {
      trigger: { ...vars, ...pipeline.trigger },
      vars,
      steps: {},
      run: { id: runId, pipeline: pipeline.name, startedAt: new Date().toISOString() },
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

    // Steps sequenziell ausführen
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      const stepName = step.name || `step-${i + 1}`;

      log.info(`Executing step ${i + 1}/${pipeline.steps.length}`, { step: stepName, runId });

      const result = await this.stepExecutor.execute(step, context, dryRun);
      run.steps.push({ name: stepName, ...result });

      // Ergebnis im Kontext speichern für spätere Steps
      context.steps[stepName] = result;

      if (result.status === 'failed') {
        log.error(`Step failed: ${stepName}`, { error: result.error, runId });
        run.status = 'failed';
        run.failedAt = stepName;

        // Rollback ausführen
        if (pipeline.rollback && pipeline.rollback.length > 0) {
          const rollbackResults = await this.rollbackHandler.execute(pipeline.rollback, context, i);
          run.rollback = rollbackResults;
        }

        run.completedAt = new Date().toISOString();
        return run;
      }

      log.info(`Step completed`, { step: stepName, durationMs: result.durationMs, runId });
    }

    run.status = 'completed';
    run.completedAt = new Date().toISOString();

    const durationMs = new Date(run.completedAt) - new Date(run.startedAt);
    log.info('Pipeline completed', { pipeline: pipeline.name, runId, durationMs });

    return run;
  }

  /**
   * Gibt alle verfügbaren Pipeline-Dateien zurück
   */
  async listPipelines(pipelinesDir) {
    const dir = pipelinesDir || path.join(__dirname, '../../pipelines');

    try {
      await fs.promises.access(dir);
    } catch {
      return [];
    }

    const files = await fs.promises.readdir(dir);
    const results = [];

    for (const f of files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))) {
      try {
        const content = await fs.promises.readFile(path.join(dir, f), 'utf8');
        const pipeline = yaml.load(content);
        results.push({
          file: f,
          name: pipeline.name || f,
          description: pipeline.description || '',
          steps: (pipeline.steps || []).length,
          hasRollback: !!(pipeline.rollback && pipeline.rollback.length > 0),
        });
      } catch {
        results.push({ file: f, name: f, error: 'Parsing fehlgeschlagen' });
      }
    }

    return results;
  }

  /**
   * Gibt die Run-History zurück
   */
  getRuns(limit = 50) {
    return Array.from(this.runs.values())
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);
  }

  /**
   * Gibt einen einzelnen Run zurück
   */
  getRun(runId) {
    return this.runs.get(runId) || null;
  }
}

module.exports = PipelineRunner;
