import cohortDocument from "../../../tests/golden-cohort/cohort.json";

export type ArchitectureBriefSeed = {
  readonly systemName: string;
  readonly description: string;
  readonly technologyStack?: readonly string[];
  readonly reviewObjectives?: readonly string[];
  readonly constraints?: readonly string[];
};

export type BatchScenarioParameters = {
  readonly environment: "dev" | "prod";
  readonly cloudProvider: 0 | 1 | 2 | 3;
  readonly constraints: readonly string[];
  readonly requiredCapabilities: readonly string[];
};

export type BatchScenario = {
  readonly name: string;
  readonly cohortId?: string;
  readonly brief: ArchitectureBriefSeed;
  readonly parameters: BatchScenarioParameters;
};

type CohortItemJson = {
  readonly id: string;
  readonly title: string;
};

const CONSTRAINT_PRIVATE_ENDPOINTS = "Private endpoints required";
const CONSTRAINT_MANAGED_IDENTITY = "Use managed identity";
const CONSTRAINT_DATA_RESIDENCY_EU = "EU data residency — no US-region PII processing";
const CONSTRAINT_COST_CAP = "Hard monthly infrastructure cap — $50k USD";

const CAPABILITY_AZURE_CORE = ["Azure SQL", "Managed Identity", "Private Networking"] as const;
const CAPABILITY_RAG = ["Azure AI Search", "Azure OpenAI", "Managed Identity", "Private Networking"] as const;
const CAPABILITY_EVENT = ["Azure Event Hubs", "Stream Analytics", "Cosmos DB"] as const;
const CAPABILITY_PCI = ["Azure API Management", "Key Vault", "Tokenization boundary"] as const;
const CAPABILITY_EDGE = ["Azure IoT Edge", "Azure Digital Twins", "OPC UA gateway"] as const;
const CAPABILITY_MAINFRAME = ["IBM MQ", "Azure Logic Apps", "API Management"] as const;

const DEFAULT_PARAMETERS: BatchScenarioParameters = {
  environment: "prod",
  cloudProvider: 1,
  constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_MANAGED_IDENTITY],
  requiredCapabilities: [...CAPABILITY_AZURE_CORE],
};

const PARAMETER_VARIANTS: readonly BatchScenarioParameters[] = [
  DEFAULT_PARAMETERS,
  {
    environment: "dev",
    cloudProvider: 1,
    constraints: [CONSTRAINT_COST_CAP],
    requiredCapabilities: ["App Service", "Azure SQL"],
  },
  {
    environment: "prod",
    cloudProvider: 2,
    constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_DATA_RESIDENCY_EU],
    requiredCapabilities: ["Amazon RDS", "AWS PrivateLink", "IAM roles"],
  },
  {
    environment: "prod",
    cloudProvider: 3,
    constraints: [CONSTRAINT_MANAGED_IDENTITY, CONSTRAINT_DATA_RESIDENCY_EU],
    requiredCapabilities: ["Cloud SQL", "VPC Service Controls", "Workload Identity"],
  },
  {
    environment: "dev",
    cloudProvider: 1,
    constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_COST_CAP],
    requiredCapabilities: [...CAPABILITY_RAG],
  },
];

const EXTRA_BRIEFS: readonly {
  readonly name: string;
  readonly brief: ArchitectureBriefSeed;
  readonly parameters: BatchScenarioParameters;
}[] = [
  {
    name: "extra-event-driven-iot-ingestion",
    brief: {
      systemName: "PulseStream IoT Ingestion",
      description:
        "Design an event-driven IoT ingestion platform with device telemetry through Azure IoT Hub, stream processing, and cold storage for manufacturing telemetry.",
    },
    parameters: {
      environment: "prod",
      cloudProvider: 1,
      constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_MANAGED_IDENTITY],
      requiredCapabilities: [...CAPABILITY_EVENT],
    },
  },
  {
    name: "extra-pci-payment-gateway",
    brief: {
      systemName: "CardBridge PCI Gateway",
      description:
        "Design a PCI-scoped payment capture service with tokenization boundary, Key Vault HSM-backed keys, and private API Management ingress.",
    },
    parameters: {
      environment: "prod",
      cloudProvider: 1,
      constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_DATA_RESIDENCY_EU],
      requiredCapabilities: [...CAPABILITY_PCI],
    },
  },
  {
    name: "extra-multi-region-rag",
    brief: {
      systemName: "AtlasRAG Global",
      description:
        "Design a multi-region enterprise RAG platform with Azure AI Search replicas, private endpoints, and EU/US data residency partitions.",
    },
    parameters: {
      environment: "prod",
      cloudProvider: 1,
      constraints: [CONSTRAINT_PRIVATE_ENDPOINTS, CONSTRAINT_MANAGED_IDENTITY, CONSTRAINT_DATA_RESIDENCY_EU],
      requiredCapabilities: [...CAPABILITY_RAG],
    },
  },
  {
    name: "extra-mainframe-integration-hub",
    brief: {
      systemName: "HostBridge MQ Hub",
      description:
        "Design a mainframe integration hub bridging IBM MQ workloads to cloud APIs with Logic Apps, API Management, and audited transformation.",
    },
    parameters: {
      environment: "prod",
      cloudProvider: 1,
      constraints: [CONSTRAINT_PRIVATE_ENDPOINTS],
      requiredCapabilities: [...CAPABILITY_MAINFRAME],
    },
  },
  {
    name: "extra-edge-manufacturing",
    brief: {
      systemName: "ForgeLine Edge MES",
      description:
        "Design an edge manufacturing integration with IoT Edge modules, OPC UA gateways, and cloud Digital Twins synchronization.",
    },
    parameters: {
      environment: "dev",
      cloudProvider: 1,
      constraints: [CONSTRAINT_COST_CAP, CONSTRAINT_MANAGED_IDENTITY],
      requiredCapabilities: [...CAPABILITY_EDGE],
    },
  },
];

function cohortDescription(title: string): string {
  return `${title}. Provide a concise target architecture suitable for automated merge tests; prefer Azure patterns.`;
}

function cohortScenario(item: CohortItemJson, parameters: BatchScenarioParameters): BatchScenario {
  return {
    name: `cohort-${item.id}`,
    cohortId: item.id,
    brief: {
      systemName: `GoldenCohort_${item.id}`,
      description: cohortDescription(item.title),
    },
    parameters,
  };
}

function extraScenario(entry: (typeof EXTRA_BRIEFS)[number]): BatchScenario {
  return {
    name: entry.name,
    brief: entry.brief,
    parameters: entry.parameters,
  };
}

/** Builds unique scenario templates from golden cohort, parameter variants, and extra briefs. */
function buildUniqueArchitectureLifecycleBatchScenarios(): readonly BatchScenario[] {
  const items = (cohortDocument.items ?? []) as CohortItemJson[];
  const scenarios: BatchScenario[] = [];

  for (const item of items) {
    scenarios.push(cohortScenario(item, DEFAULT_PARAMETERS));
  }

  for (let index = 0; index < PARAMETER_VARIANTS.length; index++) {
    const item = items[index];

    if (!item) {
      break;
    }

    scenarios.push(cohortScenario(item, PARAMETER_VARIANTS[index]));
  }

  for (const entry of EXTRA_BRIEFS) {
    scenarios.push(extraScenario(entry));
  }

  return scenarios;
}

/** Distinct templates before cycling (cohort items + parameter variants + extra briefs). */
export const ARCHITECTURE_LIFECYCLE_BATCH_UNIQUE_SCENARIO_COUNT =
  buildUniqueArchitectureLifecycleBatchScenarios().length;

function expandScenarioCount(
  baseScenarios: readonly BatchScenario[],
  targetCount: number,
): readonly BatchScenario[] {
  if (targetCount <= baseScenarios.length) {
    return baseScenarios.slice(0, targetCount);
  }

  const expanded: BatchScenario[] = [...baseScenarios];
  let cycle = 2;

  while (expanded.length < targetCount) {
    for (const scenario of baseScenarios) {
      if (expanded.length >= targetCount) {
        break;
      }

      expanded.push({
        ...scenario,
        name: `${scenario.name}-cycle${cycle}`,
      });
    }

    cycle += 1;
  }

  return expanded;
}

/** Builds architecture lifecycle batch scenarios; repeats templates when targetCount exceeds unique pool. */
export function buildArchitectureLifecycleBatchScenarios(targetCount = 30): readonly BatchScenario[] {
  const normalizedCount = Math.max(1, Math.floor(targetCount));
  const uniqueScenarios = buildUniqueArchitectureLifecycleBatchScenarios();

  return expandScenarioCount(uniqueScenarios, normalizedCount);
}

export function toArchitectureRequestBody(
  scenario: BatchScenario,
  requestSuffix: string,
): Record<string, unknown> {
  // scenario.name is unique per batch row (includes cycle suffix when repeating templates).
  const requestIdBase = `lifecycle-batch-${scenario.name}-${requestSuffix}`;

  const requestId = requestIdBase.length > 64 ? requestIdBase.slice(0, 64) : requestIdBase;

  const mergedConstraints = [
    ...new Set([...scenario.parameters.constraints, ...(scenario.brief.constraints ?? [])]),
  ];

  return {
    requestId,
    description: scenario.brief.description,
    systemName: scenario.brief.systemName,
    environment: scenario.parameters.environment,
    cloudProvider: scenario.parameters.cloudProvider,
    constraints: mergedConstraints,
    requiredCapabilities: [...scenario.parameters.requiredCapabilities],
    assumptions: [] as string[],
    priorManifestVersion: null as string | null,
  };
}
