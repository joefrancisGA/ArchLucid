import {
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_TAB_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  infraTerraformFilterHrefFromSearch,
  parseInfraTerraformWorkbenchPath,
} from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY, parseStoredRecentViews } from "@/lib/operator/operator-recent-views";
import { isInfrastructureResourcesRoutePath } from "@/lib/product-line/securenow-infrastructure-resources-route";
import { infrastructureTerraformPathForProductLine } from "@/lib/product-line/securenow-infrastructure-routes";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { parseInfraEvidenceWorkbenchQueryValue } from "@/lib/infra-evidence/infra-evidence-workbench-url";

export type ContinueLastInfraEvidenceTerraformWorkbenchTarget = {
  readonly href: string;
  readonly cloudResourceId: string;
  readonly label: string;
  readonly viewedAtUtc: string;
};

function cloudResourceIdFromResourceHubPath(pathname: string): string | null {
  const bare = pathname.split("?")[0] ?? pathname;

  if (!isInfrastructureResourcesRoutePath(bare)) {
    return null;
  }

  const segments = bare.split("/").filter((segment) => segment.length > 0);
  const resourceId = segments.at(-1)?.trim() ?? "";

  if (resourceId.length === 0 || resourceId === "resources") {
    return null;
  }

  return resourceId;
}

function readRecentTerraformWorkbenchTarget(): ContinueLastInfraEvidenceTerraformWorkbenchTarget | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);

    for (const entry of state.entries) {
      const parsedWorkbench = parseInfraTerraformWorkbenchPath(entry.href);

      if (parsedWorkbench != null) {
        const label =
          entry.label.trim().length > 0 ? entry.label.trim() : "Recent Terraform mapping";

        return {
          href: entry.href,
          cloudResourceId: parsedWorkbench.cloudResourceId,
          label,
          viewedAtUtc: entry.visitedAtUtc,
        };
      }

      const [path = "", search = ""] = entry.href.split("?");
      const params = new URLSearchParams(search);
      const tab = parseInfraEvidenceWorkbenchQueryValue(params.get(RESOURCE_HUB_TAB_PARAM));

      if (tab !== "terraform") {
        continue;
      }

      const cloudResourceId = cloudResourceIdFromResourceHubPath(path);

      if (cloudResourceId === null) {
        continue;
      }

      const snapshotId = parseInfraEvidenceWorkbenchQueryValue(params.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
      const label =
        entry.label.trim().length > 0 ? entry.label.trim() : "Recent resource hub Terraform tab";

      return {
        href: entry.href,
        cloudResourceId,
        label,
        viewedAtUtc: entry.visitedAtUtc,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Resolves the most recent scoped Terraform mapping visit from operator recent views. */
export function resolveContinueLastInfraEvidenceTerraformWorkbench(
  productLine: ProductLineId,
): ContinueLastInfraEvidenceTerraformWorkbenchTarget | null {
  const recent = readRecentTerraformWorkbenchTarget();

  if (recent === null) {
    return null;
  }

  const [, search = ""] = recent.href.split("?");
  const params = new URLSearchParams(search);
  const snapshotId = parseInfraEvidenceWorkbenchQueryValue(params.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const parsedWorkbench = parseInfraTerraformWorkbenchPath(recent.href);
  const resolvedSnapshotId =
    parsedWorkbench != null && parsedWorkbench.snapshotId.length > 0
      ? parsedWorkbench.snapshotId
      : snapshotId;

  const terraformPath = infrastructureTerraformPathForProductLine(productLine);
  const href = infraTerraformFilterHrefFromSearch(
    "",
    {
      cloudResourceId: recent.cloudResourceId,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
      assessmentId: params.get("assessmentId") ?? undefined,
      auditEvidenceSnapshotId: params.get("auditEvidenceSnapshotId") ?? undefined,
      controlId: params.get("controlId") ?? undefined,
    },
    terraformPath,
  );

  return {
    ...recent,
    href,
  };
}
