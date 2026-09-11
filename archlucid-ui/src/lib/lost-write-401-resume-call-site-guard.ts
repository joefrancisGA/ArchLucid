import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LOST_WRITE_401_RESUME_KIND_INVENTORY,
  type LostWrite401ResumeKindRow,
} from "@/lib/lost-write-401-resume-inventory";

const API_IMPLEMENTATION_SUFFIXES = [
  "lib/api/governance-stickiness-api-dispositions.ts",
  "lib/governance/governance-mutation-correction-api.ts",
  "lib/api/draft-intake-api-crud.ts",
  "lib/api/architecture-runs-lifecycle.ts",
  "lib/api/governance-workflow-api-approvals.ts",
  "lib/api/governance-workflow-api-environments.ts",
  "lib/api/policy-packs-api-mutate.ts",
  "lib/api/itsm-outbound-connections-settings.ts",
  "lib/api/azure-boards-api.ts",
  "lib/api/advisory-digests-read-export.ts",
  "lib/api/architecture-share-api.ts",
  "lib/api/governance-stickiness-api-exceptions-schedules.ts",
] as const;

const KIND_WRAPPER_MARKERS: Record<string, readonly string[]> = {
  finding_disposition: ["recordFindingDispositionWith401Resume"],
  governance_mutation_correction: ["recordGovernanceMutationCorrectionWith401Resume"],
  architecture_draft_patch: ["patchDraftRequestWith401Resume"],
  finding_bulk_disposition: ["recordBulkFindingDispositionWith401Resume"],
  governance_workflow_transition: ["submitGovernanceWorkflowTransitionWith401Resume"],
  architecture_review_finalize: ["commitArchitectureRunWith401Resume"],
  policy_pack_save: ["createPolicyPackWith401Resume", "publishPolicyPackVersionWith401Resume"],
  itsm_connector_save: ["saveItsmConnectorWith401Resume"],
  architecture_share_grant: ["mutateArchitectureShareWith401Resume"],
  risk_exception_write: ["renewRiskExceptionWith401Resume", "revokeRiskExceptionWith401Resume"],
};

const SHARED_MARKERS = ["withLivelihood401Resume", "executeIdempotentLivelihoodMutation"] as const;

export type LostWrite401ResumeCallSiteViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

function isApiImplementationRoot(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);

  return API_IMPLEMENTATION_SUFFIXES.some(
    (suffix) => normalized === suffix || normalized.endsWith(`/${suffix}`),
  );
}

function resolveUiRelativePath(uiRoot: string, sourceRoot: string): string {
  const normalized = normalizeRelativePath(sourceRoot);
  const fromSrc = join(uiRoot, "src", normalized);

  if (existsSync(fromSrc)) {
    return normalized;
  }

  return normalized;
}

function fileContainsAnyMarker(source: string, markers: readonly string[]): boolean {
  return markers.some((marker) => source.includes(marker));
}

function resolveMarkersForRow(row: LostWrite401ResumeKindRow): readonly string[] {
  const kindMarkers = KIND_WRAPPER_MARKERS[row.id] ?? [];

  return [...kindMarkers, ...SHARED_MARKERS];
}

export function findLostWrite401ResumeCallSiteViolations(uiRoot: string): LostWrite401ResumeCallSiteViolation[] {
  const violations: LostWrite401ResumeCallSiteViolation[] = [];

  for (const row of LOST_WRITE_401_RESUME_KIND_INVENTORY) {
    if (row.resumeWrapperPresent !== "yes") {
      violations.push({
        relativePath: row.id,
        message: `401 resume kind ${row.id} is still marked "no" in LOST_WRITE_401_RESUME_KIND_INVENTORY.`,
      });
    }

    const markers = resolveMarkersForRow(row);

    for (const sourceRoot of row.sourceRoots) {
      const relativePath = resolveUiRelativePath(uiRoot, sourceRoot);
      const absolutePath = join(uiRoot, "src", relativePath);

      if (!existsSync(absolutePath)) {
        violations.push({
          relativePath,
          message: `Inventoried 401 resume source root is missing on disk for kind ${row.id}.`,
        });
        continue;
      }

      if (isApiImplementationRoot(relativePath)) {
        const source = readFileSync(absolutePath, "utf8");

        if (
          !fileContainsAnyMarker(source, markers)
          && !source.includes("rethrowLivelihoodMutate401")
        ) {
          violations.push({
            relativePath,
            message: `API implementation for ${row.id} must expose a With401Resume wrapper or rethrowLivelihoodMutate401.`,
          });
        }

        continue;
      }

      const source = readFileSync(absolutePath, "utf8");

      if (!fileContainsAnyMarker(source, markers)) {
        violations.push({
          relativePath,
          message: `Livelihood mutate site for ${row.id} is missing a With401Resume wrapper marker.`,
        });
      }
    }
  }

  return violations;
}
