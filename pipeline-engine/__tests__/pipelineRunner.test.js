const fs = require('fs');
const os = require('os');
const path = require('path');

const ConnectorRegistry = require('../src/connectors/ConnectorRegistry');
const PipelineRunner = require('../src/engine/PipelineRunner');

class MockConnector {
  constructor(name) {
    this.name = name;
    this.baseUrl = 'mock://connector';
    this.actions = {
      task: { method: 'POST', path: '/task', description: 'mock task' },
    };
    this.calls = [];
  }

  async execute(action, params, dryRun) {
    this.calls.push({ action, params, dryRun });
    return {
      connector: this.name,
      action,
      params,
    };
  }
}

describe('PipelineRunner v2', () => {
  function createRunner() {
    const registry = new ConnectorRegistry();
    const connector = new MockConnector('mock');
    registry.register('mock', connector);
    return { runner: new PipelineRunner(registry), connector };
  }

  test('validateDefinition accepts condition, parallel and foreach steps', () => {
    const { runner } = createRunner();

    expect(() =>
      runner.validateDefinition({
        name: 'pipeline-v2',
        steps: [
          {
            name: 'Conditional task',
            condition: { left: '{{ vars.enabled }}', equals: true },
            system: 'mock',
            action: 'task',
          },
          {
            name: 'Parallel block',
            parallel: [
              { name: 'A', system: 'mock', action: 'task' },
              { name: 'B', system: 'mock', action: 'task' },
            ],
          },
          {
            name: 'Foreach block',
            foreach: {
              items: '{{ vars.items }}',
              as: 'item',
              steps: [{ name: 'Loop task', system: 'mock', action: 'task' }],
            },
          },
        ],
      }),
    ).not.toThrow();
  });

  test('run executes parallel and foreach blocks and skips false conditions', async () => {
    const { runner, connector } = createRunner();
    const tempFile = path.join(os.tmpdir(), `pipeline-runner-${Date.now()}.yaml`);

    await fs.promises.writeFile(
      tempFile,
      `
name: "runner-v2"
steps:
  - name: "Skipped action"
    condition: false
    system: mock
    action: task

  - name: "Parallel fanout"
    parallel:
      - name: "Branch one"
        system: mock
        action: task
        params:
          branch: one
      - name: "Branch two"
        system: mock
        action: task
        params:
          branch: two

  - name: "Loop fanout"
    foreach:
      items: "{{ vars.targets }}"
      as: target
      steps:
        - name: "Per target"
          system: mock
          action: task
          params:
            target: "{{ vars.target }}"
`,
      'utf8',
    );

    const result = await runner.run(tempFile, { targets: ['srv-1', 'srv-2'] }, { dryRun: true });

    expect(result.status).toBe('completed');
    expect(result.steps[0].status).toBe('skipped');
    expect(result.steps[1].type).toBe('parallel');
    expect(result.steps[1].branches).toHaveLength(2);
    expect(result.steps[2].type).toBe('foreach');
    expect(result.steps[2].iterations).toHaveLength(2);
    expect(connector.calls).toHaveLength(4);
    expect(connector.calls[2].params.target).toBe('srv-1');
    expect(connector.calls[3].params.target).toBe('srv-2');
  });

  test('run fails when foreach items do not resolve to an array', async () => {
    const { runner } = createRunner();
    const tempFile = path.join(os.tmpdir(), `pipeline-runner-invalid-${Date.now()}.yaml`);

    await fs.promises.writeFile(
      tempFile,
      `
name: "runner-invalid"
steps:
  - name: "Invalid foreach"
    foreach:
      items: "{{ vars.target }}"
      as: target
      steps:
        - name: "Per target"
          system: mock
          action: task
`,
      'utf8',
    );

    const result = await runner.run(tempFile, { target: 'srv-1' }, { dryRun: true });

    expect(result.status).toBe('failed');
    expect(result.failedAt).toBe('Invalid foreach');
  });

  test('v2 templates validate successfully', async () => {
    const { runner } = createRunner();
    const templateDir = path.join(__dirname, '..', 'pipelines');
    const templates = [
      'cross-itsm-incident.yaml',
      'cmdb-reconciliation.yaml',
      'multi-pam-password-rotation.yaml',
      'azure-ad-pim-jit.yaml',
      'remedy-major-incident-bridge.yaml',
    ];

    for (const fileName of templates) {
      const result = await runner.validate(path.join(templateDir, fileName));
      expect(result.valid).toBe(true);
    }
  });
});
