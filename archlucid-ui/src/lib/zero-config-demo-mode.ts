import type { UseFormSetValue } from "react-hook-form";

import {
  AWS_INVENTORY_DEMO_SCENARIO_IDS,
  DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID,
  type AwsInventoryDemoScenarioId,
} from "@/lib/arch-lucid-aws-inventory-demo-scenarios";
import {
  DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  AZURE_EXTRACTOR_DEMO_SCENARIO_IDS,
  type DemoReviewScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID,
  GCP_INVENTORY_DEMO_SCENARIO_IDS,
  type GcpInventoryDemoScenarioId,
} from "@/lib/arch-lucid-gcp-inventory-demo-scenarios";
import {
  buildWizardPrefillFromInventoryDemoScenario,
  createInventoryDemoZipFile,
  defaultInventoryDemoScenarioId,
  type InventoryDemoScenarioId,
  validateInventoryDemoZipBytes,
} from "@/lib/arch-lucid-inventory-demo-scenarios";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Query flag for one-click demo review intake (`/architecture/reviews/new?zeroConfig=1`). */
export const ZERO_CONFIG_DEMO_QUERY_KEY = "zeroConfig";

export const ZERO_CONFIG_DEMO_WIZARD_HREF = `/architecture/reviews/new?${ZERO_CONFIG_DEMO_QUERY_KEY}=1`;

export const ZERO_CONFIG_DEMO_TRY_DEMO_LABEL = "Try with Demo Data";

/** @deprecated Use {@link ZERO_CONFIG_DEMO_TRY_DEMO_LABEL}. */
export const ZERO_CONFIG_DEMO_TRY_SAMPLE_LABEL = ZERO_CONFIG_DEMO_TRY_DEMO_LABEL;

export type ZeroConfigDemoPlatform = CloudInventoryPlatform;

export type ZeroConfigDemoApplyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export type ZeroConfigDemoSelection = {
  readonly platform: ZeroConfigDemoPlatform;
  readonly scenarioId: InventoryDemoScenarioId;
};

const ZERO_CONFIG_AZURE_ALIASES = new Set(["1", "true", "yes", "azure"]);

function wizardCloudProviderForPlatform(platform: ZeroConfigDemoPlatform): WizardFormValues["cloudProvider"] {
  switch (platform) {
    case "azure":
      return "Azure";
    case "aws":
      return "Aws";
    case "gcp":
      return "Gcp";
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

function isAwsInventoryDemoScenarioId(value: string): value is AwsInventoryDemoScenarioId {
  return (AWS_INVENTORY_DEMO_SCENARIO_IDS as readonly string[]).includes(value);
}

function isGcpInventoryDemoScenarioId(value: string): value is GcpInventoryDemoScenarioId {
  return (GCP_INVENTORY_DEMO_SCENARIO_IDS as readonly string[]).includes(value);
}

function isAzureDemoReviewScenarioId(value: string): value is DemoReviewScenarioId {
  return (AZURE_EXTRACTOR_DEMO_SCENARIO_IDS as readonly string[]).includes(value);
}

function parseZeroConfigDemoToken(raw: string): ZeroConfigDemoSelection | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (ZERO_CONFIG_AZURE_ALIASES.has(lower)) {
    return { platform: "azure", scenarioId: DEFAULT_DEMO_REVIEW_SCENARIO_ID };
  }

  if (lower === "aws") {
    return { platform: "aws", scenarioId: DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID };
  }

  if (lower === "gcp") {
    return { platform: "gcp", scenarioId: DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID };
  }

  const colonIndex = trimmed.indexOf(":");

  if (colonIndex > 0) {
    const platformToken = trimmed.slice(0, colonIndex).trim().toLowerCase();
    const scenarioToken = trimmed.slice(colonIndex + 1).trim();

    if (platformToken === "aws" && isAwsInventoryDemoScenarioId(scenarioToken)) {
      return { platform: "aws", scenarioId: scenarioToken };
    }

    if (platformToken === "gcp" && isGcpInventoryDemoScenarioId(scenarioToken)) {
      return { platform: "gcp", scenarioId: scenarioToken };
    }

    if (platformToken === "azure" && isAzureDemoReviewScenarioId(scenarioToken)) {
      return { platform: "azure", scenarioId: scenarioToken };
    }
  }

  if (isAzureDemoReviewScenarioId(trimmed)) {
    return { platform: "azure", scenarioId: trimmed };
  }

  if (isAwsInventoryDemoScenarioId(trimmed)) {
    return { platform: "aws", scenarioId: trimmed };
  }

  if (isGcpInventoryDemoScenarioId(trimmed)) {
    return { platform: "gcp", scenarioId: trimmed };
  }

  return null;
}

export function resolveZeroConfigDemoSelection(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): ZeroConfigDemoSelection {
  const raw = searchParams?.get(ZERO_CONFIG_DEMO_QUERY_KEY)?.trim() ?? "";

  return parseZeroConfigDemoToken(raw) ?? {
    platform: "azure",
    scenarioId: DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  };
}

export function isZeroConfigDemoQuery(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  const raw = searchParams?.get(ZERO_CONFIG_DEMO_QUERY_KEY)?.trim() ?? "";

  if (raw.length === 0) {
    return false;
  }

  return parseZeroConfigDemoToken(raw) !== null;
}

/** @deprecated Use {@link resolveZeroConfigDemoSelection}. */
export function resolveZeroConfigDemoScenarioId(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): DemoReviewScenarioId {
  const selection = resolveZeroConfigDemoSelection(searchParams);

  if (selection.platform !== "azure") {
    return DEFAULT_DEMO_REVIEW_SCENARIO_ID;
  }

  return selection.scenarioId as DemoReviewScenarioId;
}

export function applyBundledDemoPackageToWizard(
  selection: ZeroConfigDemoSelection,
  setValue: UseFormSetValue<WizardFormValues>,
  onPendingFileChange: (file: File | null) => void,
): ZeroConfigDemoApplyResult {
  const zipValidation = validateInventoryDemoZipBytes(selection.platform, selection.scenarioId);

  if (!zipValidation.ok) {
    return { ok: false, message: zipValidation.message };
  }

  const prefill = buildWizardPrefillFromInventoryDemoScenario(selection.platform, selection.scenarioId);

  if (prefill.description !== undefined) {
    setValue("description", prefill.description, { shouldValidate: true, shouldDirty: true });
  }

  if (prefill.systemName !== undefined) {
    setValue("systemName", prefill.systemName, { shouldValidate: true, shouldDirty: true });
  }

  if (prefill.topologyHints !== undefined) {
    setValue("topologyHints", prefill.topologyHints, { shouldValidate: true, shouldDirty: true });
  }

  setValue("cloudProvider", wizardCloudProviderForPlatform(selection.platform), {
    shouldValidate: true,
    shouldDirty: true,
  });
  onPendingFileChange(createInventoryDemoZipFile(selection.platform, selection.scenarioId));

  return { ok: true };
}

/** Applies the default bundled demo scenario for the resolved platform. */
export function applyBundledSamplePackageToWizard(
  setValue: UseFormSetValue<WizardFormValues>,
  onPendingFileChange: (file: File | null) => void,
  selection: ZeroConfigDemoSelection = {
    platform: "azure",
    scenarioId: defaultInventoryDemoScenarioId("azure"),
  },
): ZeroConfigDemoApplyResult {
  return applyBundledDemoPackageToWizard(selection, setValue, onPendingFileChange);
}
