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
  readonly snapshotId: string;
  readonly assessmentId: string;
  readonly auditEvidenceSnapshotId: string;
  readonly controlId: string;
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

function resolveTerraformWorkbenchTargetFromEntry(
  entry: { href: string; label: string; visitedAtUtc: string },
  productLine: ProductLineId,
): ContinueLastInfraEvidenceTerraformWorkbenchTarget | null {
  const parsedWorkbench = parseInfraTerraformWorkbenchPath(entry.href);

  if (parsedWorkbench != null) {
    const [, search = ""] = entry.href.split("?");
    const params = new URLSearchParams(search);
    const label = entry.label.trim().length > 0 ? entry.label.trim() : "Recent Terraform mapping";
    const terraformPath = infrastructureTerraformPathForProductLine(productLine);
    const href = infraTerraformFilterHrefFromSearch(
      "",
      {
        cloudResourceId: parsedWorkbench.cloudResourceId,
        snapshotId: parsedWorkbench.snapshotId.length > 0 ? parsedWorkbench.snapshotId : undefined,
        assessmentId: params.get("assessmentId") ?? undefined,
        auditEvidenceSnapshotId: params.get("auditEvidenceSnapshotId") ?? undefined,
        controlId: params.get("controlId") ?? undefined,
      },
      terraformPath,
    );

    return {
      href,
      cloudResourceId: parsedWorkbench.cloudResourceId,
      label,
      viewedAtUtc: entry.visitedAtUtc,
      snapshotId: parsedWorkbench.snapshotId,
      assessmentId: params.get("assessmentId")?.trim() ?? "",
      auditEvidenceSnapshotId: params.get("auditEvidenceSnapshotId")?.trim() ?? "",
      controlId: params.get("controlId")?.trim() ?? "",
    };
  }

  const [path = "", search = ""] = entry.href.split("?");
  const params = new URLSearchParams(search);
  const tab = parseInfraEvidenceWorkbenchQueryValue(params.get(RESOURCE_HUB_TAB_PARAM));

  if (tab !== "terraform") {
    return null;
  }

  const cloudResourceId = cloudResourceIdFromResourceHubPath(path);

  if (cloudResourceId === null) {
    return null;
  }

  const snapshotId = parseInfraEvidenceWorkbenchQueryValue(params.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const label = entry.label.trim().length > 0 ? entry.label.trim() : "Recent resource hub Terraform tab";
  const terraformPath = infrastructureTerraformPathForProductLine(productLine);
  const href = infraTerraformFilterHrefFromSearch(
    "",
    {
      cloudResourceId,
      snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
      assessmentId: params.get("assessmentId") ?? undefined,
      auditEvidenceSnapshotId: params.get("auditEvidenceSnapshotId") ?? undefined,
      controlId: params.get("controlId") ?? undefined,
    },
    terraformPath,
  );

  return {
    href,
    cloudResourceId,
    label,
    viewedAtUtc: entry.visitedAtUtc,
    snapshotId,
    assessmentId: params.get("assessmentId")?.trim() ?? "",
    auditEvidenceSnapshotId: params.get("auditEvidenceSnapshotId")?.trim() ?? "",
    controlId: params.get("controlId")?.trim() ?? "",
  };
}

function readRecentTerraformWorkbenchTargets(
  productLine: ProductLineId,
  maxEntries: number,
): readonly ContinueLastInfraEvidenceTerraformWorkbenchTarget[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    const state = parseStoredRecentViews(raw);
    const seenResourceIds = new Set<string>();
    const targets: ContinueLastInfraEvidenceTerraformWorkbenchTarget[] = [];

    for (const entry of state.entries) {
      const target = resolveTerraformWorkbenchTargetFromEntry(entry, productLine);

      if (target === null || seenResourceIds.has(target.cloudResourceId)) {
        continue;
      }

      seenResourceIds.add(target.cloudResourceId);
      targets.push(target);

      if (targets.length >= maxEntries) {
        break;
      }
    }

    return targets;
  } catch {
    return [];
  }
}

/** Resolves the most recent scoped Terraform mapping visit from operator recent views. */
export function resolveContinueLastInfraEvidenceTerraformWorkbench(
  productLine: ProductLineId,
): ContinueLastInfraEvidenceTerraformWorkbenchTarget | null {
  const [recent] = readRecentTerraformWorkbenchTargets(productLine, 1);

  return recent ?? null;
}

/** Lists recent scoped Terraform mapping visits from operator recent views. */
export function listRecentInfraEvidenceTerraformWorkbenchTargets(
  productLine: ProductLineId,
  maxEntries = 5,
): readonly ContinueLastInfraEvidenceTerraformWorkbenchTarget[] {
  return readRecentTerraformWorkbenchTargets(productLine, maxEntries);
}
