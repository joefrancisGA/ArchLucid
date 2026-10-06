import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AZURE_LAB_DEMO_SCENARIO_IDS,
  getAzureLabDemoScenario,
  getAzureLabDemoZipBytes,
  type AzureLabDemoScenarioId,
} from "@/lib/azure-lab-inventory-demo-scenarios";

export type AzureLabCliScenario = AzureLabDemoScenarioId | "all";

export type AzureLabCliOptions = {
  scenario: AzureLabCliScenario;
  outputPath: string;
  force: boolean;
};

const scenarioAliases: Readonly<Record<string, AzureLabCliScenario>> = {
  "landing-zone": "azure-lab-landing-zone",
  "landing-zone-later": "azure-lab-landing-zone-later",
  "messy-estate": "azure-lab-messy-estate",
  all: "all",
};

export const AZURE_LAB_CLI_USAGE = `Usage:
  npm run generate:azure-lab -- --scenario <scenario> [--out <path>] [--force]

Scenarios:
  landing-zone        500-resource landing zone
  landing-zone-later  later 500-resource snapshot for drift
  messy-estate        irregular 50-resource estate
  all                 write all three packs to an output directory

Options:
  --out <path>        ZIP path, or output directory with --scenario all
  --force              overwrite existing ZIP files
  --help               show this help`;

function resolveScenario(rawScenario: string): AzureLabCliScenario {
  const scenario = scenarioAliases[rawScenario] ?? rawScenario;

  if (scenario === "all" || AZURE_LAB_DEMO_SCENARIO_IDS.includes(scenario as AzureLabDemoScenarioId)) {
    return scenario as AzureLabCliScenario;
  }

  throw new Error(`Unknown scenario '${rawScenario}'. Use --help to list valid scenarios.`);
}

export function parseAzureLabCliArguments(args: readonly string[]): AzureLabCliOptions {
  let scenario: AzureLabCliScenario | null = null;
  let outputPath: string | null = null;
  let force = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--scenario") {
      const rawScenario = args[index + 1];

      if (rawScenario === undefined) {
        throw new Error("--scenario requires a value.");
      }

      scenario = resolveScenario(rawScenario);
      index += 1;

      continue;
    }

    if (argument === "--out") {
      const rawOutputPath = args[index + 1];

      if (rawOutputPath === undefined || rawOutputPath.trim().length === 0) {
        throw new Error("--out requires a path.");
      }

      outputPath = resolve(rawOutputPath);
      index += 1;

      continue;
    }

    if (argument === "--force") {
      force = true;

      continue;
    }

    if (argument === "--help" || argument === "-h") {
      throw new Error(AZURE_LAB_CLI_USAGE);
    }

    throw new Error(`Unknown option '${argument}'. Use --help for usage.`);
  }

  if (scenario === null) {
    throw new Error("--scenario is required. Use --help for usage.");
  }

  return {
    scenario,
    outputPath:
      outputPath ??
      (scenario === "all" ? resolve("./azure-lab-output") : resolve(`./${getAzureLabDemoScenario(scenario).zipFilename}`)),
    force,
  };
}

function outputFiles(options: AzureLabCliOptions): Array<{ scenarioId: AzureLabDemoScenarioId; path: string }> {
  if (options.scenario === "all") {
    return AZURE_LAB_DEMO_SCENARIO_IDS.map((scenarioId) => ({
      scenarioId,
      path: resolve(options.outputPath, getAzureLabDemoScenario(scenarioId).zipFilename),
    }));
  }

  return [{ scenarioId: options.scenario, path: options.outputPath }];
}

export function writeAzureLabDemoPacks(options: AzureLabCliOptions): string[] {
  const writtenPaths: string[] = [];

  for (const outputFile of outputFiles(options)) {
    if (existsSync(outputFile.path) && !options.force) {
      throw new Error(`Refusing to overwrite '${outputFile.path}'. Re-run with --force.`);
    }

    mkdirSync(dirname(outputFile.path), { recursive: true });
    const bytes = getAzureLabDemoZipBytes(outputFile.scenarioId);
    writeFileSync(outputFile.path, bytes);
    const digest = createHash("sha256").update(bytes).digest("hex");
    const scenario = getAzureLabDemoScenario(outputFile.scenarioId);

    process.stdout.write(
      `Wrote ${basename(outputFile.path)} (${scenario.resourceCount} resources, ${bytes.length} bytes, sha256 ${digest})\n`,
    );
    writtenPaths.push(outputFile.path);
  }

  return writtenPaths;
}

export function runAzureLabCli(args: readonly string[]): number {
  try {
    const options = parseAzureLabCliArguments(args);
    writeAzureLabDemoPacks(options);

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);

    return 1;
  }
}

const scriptPath = process.argv[1] === undefined ? "" : resolve(process.argv[1]);
const runningAsScript = fileURLToPath(import.meta.url) === scriptPath;

if (runningAsScript) {
  process.exitCode = runAzureLabCli(process.argv.slice(2));
}
