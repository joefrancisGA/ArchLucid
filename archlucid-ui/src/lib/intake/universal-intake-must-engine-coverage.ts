import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";

/** Engines registered in GoldenCorpusHarness.CreateEngines() (WK-06 / PC-02). */
export const GOLDEN_CORPUS_HARNESS_ENGINE_COUNT = 16;

export type UniversalIntakeMustEngineCoverageRow = {
  readonly questionKey: string;
  readonly engineTypeIds: readonly string[];
  readonly inGoldenCorpusHarness: boolean;
  readonly workingFieldHint: string;
  readonly skippedMeasurementGapLabel: string;
};

export const UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE: readonly UniversalIntakeMustEngineCoverageRow[] = [
  {
    questionKey: "l0.actor.additional-kinds",
    engineTypeIds: ["trust-boundary", "external-exposure", "privileged-access"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Actor kinds feed trust-boundary, external-exposure, and privileged-access engines. Without actors on the graph, those measurements stay absent on seal.",
    skippedMeasurementGapLabel:
      "Trust-boundary, external-exposure, and privileged-access engines cannot score actor coverage.",
  },
  {
    questionKey: "l0.pillar.reliability",
    engineTypeIds: ["topology-coverage", "requirement-coverage"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Availability and recovery expectations feed topology-coverage and requirement-coverage engines — skipped answers leave RTO/RPO gaps unmeasured on seal.",
    skippedMeasurementGapLabel:
      "Topology-coverage and requirement-coverage engines lack reliability expectations for this package.",
  },
  {
    questionKey: "l0.pillar.security",
    engineTypeIds: ["security-baseline", "security-gap", "security-coverage", "trust-boundary"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Data sensitivity and trust boundaries feed security-baseline, security-gap, and security-coverage engines.",
    skippedMeasurementGapLabel:
      "Security-baseline, security-gap, and security-coverage engines lack declared sensitivity and boundary context.",
  },
  {
    questionKey: "l0.pillar.cost",
    engineTypeIds: ["cost-constraint"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Cost constraints feed the cost-constraint engine — without a declared budget or guardrail, cost findings stay thin on seal.",
    skippedMeasurementGapLabel: "The cost-constraint engine lacks declared budget or guardrail context.",
  },
  {
    questionKey: "l0.pillar.operations",
    engineTypeIds: ["compliance", "declaration-security-baseline"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Operations and observability expectations feed compliance and declaration-security-baseline checks.",
    skippedMeasurementGapLabel:
      "Compliance and declaration-security-baseline engines lack operations and observability context.",
  },
  {
    questionKey: "l0.pillar.performance",
    engineTypeIds: ["topology-coverage", "requirement-coverage"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Performance and scale expectations feed topology-coverage and requirement-coverage engines.",
    skippedMeasurementGapLabel:
      "Topology-coverage and requirement-coverage engines lack performance and scale expectations.",
  },
  {
    questionKey: "l0.pillar.sustainability",
    engineTypeIds: ["cost-constraint", "topology-coverage"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Resource-efficiency expectations feed cost-constraint and topology-coverage efficiency signals.",
    skippedMeasurementGapLabel:
      "Cost-constraint and topology-coverage engines lack sustainability and utilization context.",
  },
  {
    questionKey: CLOUD_TARGET_QUESTION_KEY,
    engineTypeIds: ["compliance", "security-baseline"],
    inGoldenCorpusHarness: true,
    workingFieldHint:
      "Cloud target scopes compliance and security-baseline packs. Cloud-neutral runs skip provider-specific inventory engines that are outside the golden corpus harness.",
    skippedMeasurementGapLabel:
      "Compliance and security-baseline engines lack a declared cloud target for pack scoping.",
  },
] as const;

const COVERAGE_BY_QUESTION_KEY = new Map(
  UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE.map((row) => [row.questionKey, row]),
);

export function resolveUniversalIntakeMustEngineCoverageRow(
  questionKey: string,
): UniversalIntakeMustEngineCoverageRow | null {
  return COVERAGE_BY_QUESTION_KEY.get(questionKey) ?? null;
}

export function resolveUniversalIntakeMustEngineFieldHint(questionKey: string): string | null {
  return resolveUniversalIntakeMustEngineCoverageRow(questionKey)?.workingFieldHint ?? null;
}

export function describeSkippedMustMeasurementGap(questionKey: string): string {
  const row = resolveUniversalIntakeMustEngineCoverageRow(questionKey);

  if (row === null) {
    return `Skipped required clarification (${questionKey}) — related engine measurements may stay absent on seal.`;
  }

  return row.skippedMeasurementGapLabel;
}

export function formatUniversalIntakeMustEngineInventoryMarkdown(): string {
  const lines = [
    "# Universal intake MUST → engine coverage (PC-02)",
    "",
    "Maps each L0 MUST question to deterministic engines in `GoldenCorpusHarness.CreateEngines()`.",
    `Harness registers **${GOLDEN_CORPUS_HARNESS_ENGINE_COUNT}** engines; no 40th coverage engine is added.`,
    "",
    "| MUST question key | Harness engines | In harness |",
    "| --- | --- | --- |",
  ];

  for (const row of UNIVERSAL_INTAKE_MUST_ENGINE_COVERAGE) {
    lines.push(
      `| \`${row.questionKey}\` | ${row.engineTypeIds.map((id) => `\`${id}\``).join(", ")} | ${row.inGoldenCorpusHarness ? "yes" : "no"} |`,
    );
  }

  lines.push("");

  return lines.join("\n");
}
