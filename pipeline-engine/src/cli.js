#!/usr/bin/env node
// =============================================================================
// PAMlab Pipeline Engine — CLI Runner
// =============================================================================

const path = require('path');
const PipelineRunner = require('./engine/PipelineRunner');
const createRegistryFromEnv = require('./connectors/createRegistry');

// --- Registry mit allen Connectors aufbauen ---
function createRegistry() {
  return createRegistryFromEnv(process.env);
}

// --- Variablen aus CLI-String parsen: "user=j.doe,group=Admins" ---
function parseVars(varsStr) {
  if (!varsStr) return {};
  const vars = {};
  for (const pair of varsStr.split(',')) {
    const [key, ...rest] = pair.split('=');
    if (!key) continue;

    const rawValue = rest.join('=').trim();
    let parsedValue = rawValue;

    if (rawValue === 'true') parsedValue = true;
    else if (rawValue === 'false') parsedValue = false;
    else if (rawValue !== '' && !Number.isNaN(Number(rawValue))) parsedValue = Number(rawValue);
    else if (
      (rawValue.startsWith('[') && rawValue.endsWith(']')) ||
      (rawValue.startsWith('{') && rawValue.endsWith('}'))
    ) {
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {
        parsedValue = rawValue;
      }
    }

    vars[key.trim()] = parsedValue;
  }
  return vars;
}

// --- CLI Hauptprogramm ---
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
🔗 PAMlab Pipeline Engine — CLI

Verwendung:
  node src/cli.js run <pipeline.yaml> [--vars key=val,key=val]
  node src/cli.js dry-run <pipeline.yaml> [--vars key=val,key=val]
  node src/cli.js validate <pipeline.yaml>
  node src/cli.js list-pipelines
  node src/cli.js list-actions [connector-name]

Beispiele:
  node src/cli.js run pipelines/onboarding-with-approval.yaml --vars user=j.doe,group=Server-Admins
  node src/cli.js dry-run pipelines/jit-temporary-access.yaml --vars user=m.mueller,group=RDP-Admins,duration=4h
  node src/cli.js validate pipelines/offboarding-emergency.yaml
  node src/cli.js list-actions fudo-pam

Umgebungsvariablen:
  FUDO_URL    Fudo PAM API URL    (Standard: http://localhost:8443)
  M42_URL     Matrix42 ESM URL    (Standard: http://localhost:8444)
  AD_URL      Active Directory URL (Standard: http://localhost:8445)
  AZURE_AD_URL Microsoft Entra ID URL (Standard: http://localhost:8452)
  SNOW_URL    ServiceNow URL      (Standard: http://localhost:8447)
  JSM_URL     JSM URL             (Standard: http://localhost:8448)
  REMEDY_URL  Remedy URL          (Standard: http://localhost:8449)
  CYBERARK_URL CyberArk URL       (Standard: http://localhost:8450)
`);
    process.exit(0);
  }

  const registry = createRegistry();
  const runner = new PipelineRunner(registry);

  // --vars Flag finden
  const varsIdx = args.indexOf('--vars');
  const vars = varsIdx >= 0 ? parseVars(args[varsIdx + 1]) : {};

  switch (command) {
    case 'run': {
      const file = args[1];
      if (!file) {
        console.error('❌ Pipeline-Datei angeben!');
        process.exit(1);
      }
      const filePath = path.resolve(file);
      const result = await runner.run(filePath, vars);
      console.log('\n📊 Ergebnis:', JSON.stringify(result, null, 2));
      process.exit(result.status === 'completed' ? 0 : 1);
      break;
    }

    case 'dry-run': {
      const file = args[1];
      if (!file) {
        console.error('❌ Pipeline-Datei angeben!');
        process.exit(1);
      }
      const filePath = path.resolve(file);
      const result = await runner.run(filePath, vars, { dryRun: true });
      console.log('\n📊 Dry-Run Ergebnis:', JSON.stringify(result, null, 2));
      break;
    }

    case 'validate': {
      const file = args[1];
      if (!file) {
        console.error('❌ Pipeline-Datei angeben!');
        process.exit(1);
      }
      const filePath = path.resolve(file);
      const result = await runner.validate(filePath);
      if (result.valid) {
        console.log(`✅ Pipeline "${result.name}" ist gültig (${result.steps} Steps)`);
      } else {
        console.error('❌ Validierungsfehler:');
        result.errors.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }
      break;
    }

    case 'list-pipelines': {
      const pipelinesDir = path.join(__dirname, '../pipelines');
      const pipelines = await runner.listPipelines(pipelinesDir);
      console.log('\n📋 Verfügbare Pipelines:\n');
      pipelines.forEach((p) => {
        console.log(`  📄 ${p.file}`);
        console.log(`     Name: ${p.name}`);
        if (p.description) console.log(`     Beschreibung: ${p.description}`);
        console.log(`     Steps: ${p.steps} | Rollback: ${p.hasRollback ? 'Ja' : 'Nein'}`);
        console.log();
      });
      break;
    }

    case 'list-actions': {
      const connectorName = args[1];
      if (connectorName) {
        const connector = registry.get(connectorName);
        console.log(`\n🔧 Actions für ${connectorName}:\n`);
        for (const [name, action] of Object.entries(connector.actions)) {
          console.log(`  ${action.method.padEnd(7)} ${name}`);
          if (action.description) console.log(`          ${action.description}`);
        }
      } else {
        const detailed = registry.listDetailed();
        console.log('\n🔧 Alle Connectors und Actions:\n');
        for (const [name, info] of Object.entries(detailed)) {
          console.log(`  📡 ${name} (${info.baseUrl})`);
          console.log(`     Actions: ${info.actions.length}`);
          console.log();
        }
      }
      break;
    }

    default:
      console.error(`❌ Unbekannter Befehl: ${command}`);
      console.error('   Verwende --help für Hilfe');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
