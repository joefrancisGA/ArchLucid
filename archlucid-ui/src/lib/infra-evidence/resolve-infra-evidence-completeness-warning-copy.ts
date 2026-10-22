import {
  AzureInventoryAksWorkloadImageCollectionWarningReasons,
  AzureInventoryCollectionWarningReasons,
  AzureInventoryRelationshipCompletenessWarningCodes,
} from "./azure-inventory-completeness-warning-codes";

export type InfraEvidenceCompletenessWarningPresentation = {
  readonly code: string;
  readonly title: string;
  readonly detail: string;
};

const HOSTED_APP_SETTINGS_WARNING =
  "app-settings-not-collected-hosted-get-only";

const RBAC_SCOPE_TOO_BROAD_PREFIX = "rbac-scope-too-broad:";
const RBAC_ROLE_UNMAPPED_PREFIX = "rbac-role-unmapped:";

const AKS_WORKLOAD_IMAGE_WARNING_BASES = [
  AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedCustomerScript,
  AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedHosted,
] as const;

type ParsedAksWorkloadImageWarning = {
  readonly base: string;
  readonly reason: string;
  readonly clusterResourceId: string | null;
  readonly hostedPull: boolean;
};

function parseAksWorkloadImageCollectionWarning(warning: string): ParsedAksWorkloadImageWarning | null {
  for (const base of AKS_WORKLOAD_IMAGE_WARNING_BASES) {
    if (warning === base) {
      return {
        base,
        reason: AzureInventoryAksWorkloadImageCollectionWarningReasons.Unavailable,
        clusterResourceId: null,
        hostedPull: base === AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedHosted,
      };
    }

    const prefix = `${base}:`;

    if (!warning.startsWith(prefix)) {
      continue;
    }

    const remainder = warning.slice(prefix.length);
    const subscriptionIndex = remainder.toLowerCase().indexOf("/subscriptions/");

    if (subscriptionIndex <= 0) {
      return null;
    }

    const reason = remainder.slice(0, subscriptionIndex).replace(/:$/, "").trim();
    const clusterResourceId = remainder.slice(subscriptionIndex).trim();

    if (!reason) {
      return null;
    }

    return {
      base,
      reason,
      clusterResourceId,
      hostedPull: base === AzureInventoryRelationshipCompletenessWarningCodes.AksWorkloadImagesNotCollectedHosted,
    };
  }

  return null;
}

function formatAksClusterLabel(clusterResourceId: string | null): string {
  if (!clusterResourceId) {
    return "the AKS cluster";
  }

  const segments = clusterResourceId.split("/").filter((segment) => segment.length > 0);
  const clusterName = segments.length > 0 ? segments[segments.length - 1] : clusterResourceId;

  return `cluster ${clusterName}`;
}

function resolveAksWorkloadImageReasonCopy(
  parsed: ParsedAksWorkloadImageWarning,
): Pick<InfraEvidenceCompletenessWarningPresentation, "title" | "detail"> {
  const clusterLabel = formatAksClusterLabel(parsed.clusterResourceId);
  const collectionChannel = parsed.hostedPull
    ? "Hosted inventory could not run the cluster run command API."
    : "The identity that ran the Tier 1 CustomerScript package could not list workload images from the cluster.";
  const rerunHint = parsed.hostedPull
    ? "Re-run hosted collection with a token that can invoke managed cluster run command, or use the Tier 1 PowerShell package."
    : "Re-run the Tier 1 PowerShell package after fixing access, then re-ingest the snapshot.";
  const rbacFix =
    "Grant Azure Kubernetes Service Cluster Admin Role (or your org's equivalent) on the cluster so the collector can call managedClusters/runCommand. Without this, Pulls image from lines to container registries will not appear.";

  switch (parsed.reason) {
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.InsufficientRbac:
      return {
        title: "AKS workload images not collected (insufficient permission)",
        detail: `${collectionChannel} ${rbacFix} Affected resource: ${clusterLabel}. ${rerunHint}`,
      };
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.MissingLogs:
      return {
        title: "AKS workload images not collected (run command returned no logs)",
        detail: `${collectionChannel} Azure accepted runCommand on ${clusterLabel} but returned no logs payload. Registry pull lines may be missing until collection succeeds. ${rerunHint}`,
      };
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.RunCommandFailed:
      return {
        title: "AKS workload images not collected (run command failed)",
        detail: `${collectionChannel} The runCommand operation on ${clusterLabel} did not succeed. Check cluster health and RBAC, then ${parsed.hostedPull ? "re-run hosted collection" : "re-run the CustomerScript package"}.`,
      };
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.PollTimeout:
      return {
        title: "AKS workload images not collected (run command timed out)",
        detail: `${collectionChannel} Polling for runCommand results on ${clusterLabel} exceeded the collector time limit. ${rerunHint}`,
      };
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.HttpError:
      return {
        title: "AKS workload images not collected (Azure API error)",
        detail: `${collectionChannel} A non-success HTTP response was returned for ${clusterLabel}. ${rerunHint}`,
      };
    case AzureInventoryAksWorkloadImageCollectionWarningReasons.Error:
      return {
        title: "AKS workload images not collected (collector error)",
        detail: `${collectionChannel} An unexpected error occurred while collecting images from ${clusterLabel}. ${rerunHint}`,
      };
    default:
      return {
        title: "AKS workload images not collected",
        detail: `${collectionChannel} Container registry links from ${clusterLabel} may be missing. ${rerunHint} ${rbacFix}`,
      };
  }
}

type ParsedResourceScopedWarning = {
  readonly base: string;
  readonly reason: string;
  readonly resourceId: string | null;
};

function parseResourceScopedCollectionWarning(
  warning: string,
  bases: readonly string[],
): ParsedResourceScopedWarning | null {
  for (const base of bases) {
    const prefix = `${base}:`;

    if (!warning.startsWith(prefix)) {
      continue;
    }

    const remainder = warning.slice(prefix.length);
    const subscriptionIndex = remainder.toLowerCase().indexOf("/subscriptions/");

    if (subscriptionIndex < 0) {
      return null;
    }

    const reason = remainder.slice(0, subscriptionIndex).replace(/:$/, "").trim();
    const resourceId = remainder.slice(subscriptionIndex).trim();

    if (!reason) {
      return null;
    }

    return { base, reason, resourceId };
  }

  return null;
}

function formatArmResourceLabel(resourceId: string | null, fallbackNoun: string): string {
  if (!resourceId) {
    return fallbackNoun;
  }

  const segments = resourceId.split("/").filter((segment) => segment.length > 0);
  const name = segments.length > 0 ? segments[segments.length - 1] : resourceId;

  return `${fallbackNoun} ${name}`;
}

function resolveCollectionReasonDetail(
  reason: string,
  permissionDetail: string,
  httpDetail: string,
  errorDetail: string,
): string {
  switch (reason) {
    case AzureInventoryCollectionWarningReasons.InsufficientPermission:
      return permissionDetail;
    case AzureInventoryCollectionWarningReasons.HttpError:
      return httpDetail;
    case AzureInventoryCollectionWarningReasons.Error:
      return errorDetail;
    default:
      return errorDetail;
  }
}

function resolveLogicAppConnectionsPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  const parsed = parseResourceScopedCollectionWarning(warning, [
    AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsNotCollected,
  ]);

  if (!parsed) {
    return null;
  }

  const workflowLabel = formatArmResourceLabel(parsed.resourceId, "workflow");
  const detail = resolveCollectionReasonDetail(
    parsed.reason,
    `The collector could not read workflow definition and API connections for ${workflowLabel}. Grant read access on the Logic App (Microsoft.Logic/workflows/read) and re-run Tier 1 collection. Existing connection rows from other workflows are unchanged.`,
    `Azure returned a non-success response while reading ${workflowLabel}. Re-run Tier 1 collection after the API error is resolved.`,
    `An unexpected error occurred while reading ${workflowLabel}. Re-run Tier 1 collection.`,
  );

  return {
    code: warning,
    title: "Logic App connections not fully collected",
    detail,
  };
}

function resolveFabricCapacityAssignmentsPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  const parsed = parseResourceScopedCollectionWarning(warning, [
    AzureInventoryRelationshipCompletenessWarningCodes.FabricCapacityAssignmentsNotCollected,
  ]);

  if (!parsed) {
    return null;
  }

  const capacityLabel = formatArmResourceLabel(parsed.resourceId, "Fabric capacity");
  const detail = resolveCollectionReasonDetail(
    parsed.reason,
    `Could not list workspaces assigned to ${capacityLabel}. Grant Microsoft.Fabric/capacities/read (and workspace list permission your tenant uses) and re-run collection. Hosts lines from capacity to Fabric workspaces will be missing until this succeeds.`,
    `Azure returned a non-success response while listing workspaces for ${capacityLabel}.`,
    `An unexpected error occurred while listing workspaces for ${capacityLabel}.`,
  );

  return {
    code: warning,
    title: "Fabric capacity workspace assignments not collected",
    detail,
  };
}

function resolveFabricCapacityOutsideInventoryPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  const base = AzureInventoryRelationshipCompletenessWarningCodes.FabricCapacityWorkspacesOutsideInventory;
  const prefix = `${base}:`;

  if (!warning.startsWith(prefix)) {
    return null;
  }

  const remainder = warning.slice(prefix.length);
  const subscriptionIndex = remainder.toLowerCase().indexOf("/subscriptions/");

  if (subscriptionIndex <= 0) {
    return null;
  }

  const countText = remainder.slice(0, subscriptionIndex).replace(/:$/, "").trim();
  const capacityId = remainder.slice(subscriptionIndex).trim();
  const count = Number.parseInt(countText, 10);
  const capacityLabel = formatArmResourceLabel(capacityId, "Fabric capacity");
  const countLabel = Number.isInteger(count) && count > 0 ? `${count} workspace(s)` : "Some workspaces";

  return {
    code: warning,
    title: "Fabric workspaces assigned outside this inventory scope",
    detail: `${countLabel} linked to ${capacityLabel} are not in this snapshot (for example another subscription or capacity-only IDs). Hosts edges are drawn only for workspaces present in inventory.`,
  };
}

function resolveStaticSiteBackendsPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  const parsed = parseResourceScopedCollectionWarning(warning, [
    AzureInventoryRelationshipCompletenessWarningCodes.StaticSiteBackendsNotCollected,
  ]);

  if (!parsed) {
    return null;
  }

  const siteLabel = formatArmResourceLabel(parsed.resourceId, "static site");
  const detail = resolveCollectionReasonDetail(
    parsed.reason,
    `Could not list linked backends for ${siteLabel}. Grant read on the Static Web App and re-run Tier 1 collection. Calls lines to API or function backends will be missing until this succeeds.`,
    `Azure returned a non-success response while listing linked backends for ${siteLabel}.`,
    `An unexpected error occurred while listing linked backends for ${siteLabel}.`,
  );

  return {
    code: warning,
    title: "Static Web App linked backends not collected",
    detail,
  };
}

function resolveAksWorkloadImagePresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  const parsed = parseAksWorkloadImageCollectionWarning(warning);

  if (!parsed) {
    return null;
  }

  const reasonCopy = resolveAksWorkloadImageReasonCopy(parsed);

  return {
    code: warning,
    title: reasonCopy.title,
    detail: reasonCopy.detail,
  };
}

function formatAssignmentCount(count: number): string {
  return `${count} ${count === 1 ? "time" : "times"}`;
}

function resolveUnmappedRolePresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation | null {
  if (!warning.startsWith(RBAC_ROLE_UNMAPPED_PREFIX)) {
    return null;
  }

  const payload = warning.slice(RBAC_ROLE_UNMAPPED_PREFIX.length);
  const countedMatch = payload.match(/^(\d+):([^:]+)(?:::(.*))?$/);
  const roleDefinitionId = payload.startsWith("/")
    ? payload
    : countedMatch?.[2] ?? payload;
  const count = countedMatch ? Number.parseInt(countedMatch[1], 10) : null;
  const roleName = countedMatch?.[3]?.trim();
  const title = "Role not translated into a data-plane line";

  if (count !== null && Number.isInteger(count) && count > 0) {
    const assignmentText = `assigned ${formatAssignmentCount(count)}`;
    const roleText = roleName ? `${roleName} is ${assignmentText}.` : `This role is ${assignmentText}.`;

    return {
      code: warning,
      title,
      detail: `${roleText} Has role is recorded. No can-read or can-write line was drawn.`,
    };
  }

  return {
    code: warning,
    title,
    detail: `This role is assigned at least once. Has role is recorded. No can-read or can-write line was drawn. Role definition ${roleDefinitionId}.`,
  };
}

export function resolveInfraEvidenceCompletenessWarningPresentation(
  warning: string,
): InfraEvidenceCompletenessWarningPresentation {
  const trimmed = warning.trim();

  if (trimmed === HOSTED_APP_SETTINGS_WARNING) {
    return {
      code: trimmed,
      title: "App setting hostnames not collected on hosted pull",
      detail:
        "This capture did not read App Service app settings. Opt in to declared connection hostnames on the next hosted pull, or re-run the Tier 1 PowerShell package with -IncludeAppSettingsHosts. Only setting names and parsed host or target names are stored; values are discarded after parsing.",
    };
  }

  if (trimmed.startsWith(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsListForbiddenPrefix)) {
    const siteResourceId = trimmed.slice(
      AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsListForbiddenPrefix.length,
    );

    return {
      code: trimmed,
      title: "App settings could not be listed for this site",
      detail: `The collector identity is missing microsoft.web/sites/config/list/action on ${siteResourceId}. Declared hostname hints from app settings were skipped for that site.`,
    };
  }

  const unmappedRolePresentation = resolveUnmappedRolePresentation(trimmed);

  if (unmappedRolePresentation) {
    return unmappedRolePresentation;
  }

  if (trimmed.startsWith(RBAC_SCOPE_TOO_BROAD_PREFIX)) {
    const scope = trimmed.slice(RBAC_SCOPE_TOO_BROAD_PREFIX.length);

    return {
      code: trimmed,
      title: "Role assignment scope is too broad for per-resource edges",
      detail: `A managed identity role is scoped at ${scope}. App-to-resource authorization edges were not expanded to every child resource.`,
    };
  }

  if (trimmed.startsWith(`${AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostUnresolved}:`)) {
    return {
      code: trimmed,
      title: "App setting hostname could not be matched to inventory",
      detail: "A hostname from Tier 1 app settings did not resolve to a single Azure resource in this snapshot.",
    };
  }

  const aksWorkloadImagePresentation = resolveAksWorkloadImagePresentation(trimmed);

  if (aksWorkloadImagePresentation) {
    return aksWorkloadImagePresentation;
  }

  const logicAppPresentation = resolveLogicAppConnectionsPresentation(trimmed);

  if (logicAppPresentation) {
    return logicAppPresentation;
  }

  const fabricAssignmentsPresentation = resolveFabricCapacityAssignmentsPresentation(trimmed);

  if (fabricAssignmentsPresentation) {
    return fabricAssignmentsPresentation;
  }

  const fabricOutsidePresentation = resolveFabricCapacityOutsideInventoryPresentation(trimmed);

  if (fabricOutsidePresentation) {
    return fabricOutsidePresentation;
  }

  const staticSitePresentation = resolveStaticSiteBackendsPresentation(trimmed);

  if (staticSitePresentation) {
    return staticSitePresentation;
  }

  if (trimmed === AzureInventoryRelationshipCompletenessWarningCodes.LogicAppConnectionsMissing) {
    return {
      code: trimmed,
      title: "Logic App API connections were not in this snapshot.",
      detail:
        "No API connection lines were drawn. Re-run collection so logic-app-connections.json is included. A missing line is not a stored finding that the workflow has no connections.",
    };
  }

  if (trimmed === "diagnostic-destination-unresolved") {
    return {
      code: trimmed,
      title: "A diagnostic setting destination was not matched in this snapshot.",
      detail: "No diagnostic line was drawn for that destination.",
    };
  }

  return {
    code: trimmed,
    title: "Inventory completeness note",
    detail: trimmed,
  };
}

export function snapshotIncludesTier1AppSettingHosts(
  warnings: readonly string[],
): boolean {
  return !warnings.some((warning) => warning.trim() === HOSTED_APP_SETTINGS_WARNING);
}
