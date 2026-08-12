"""Split operator-static-demo.ts into per-scenario modules under operator-static-demo/."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SRC = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operator-static-demo.ts"
OUT_DIR = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "operator-static-demo"

# 1-based inclusive line ranges from the monolith (body only — no shared import block).
SECTIONS: list[tuple[str, int, int]] = [
    ("eligibility.ts", 46, 234),
    ("run-list-and-compare.ts", 236, 438),
    ("showcase-spine-payloads.ts", 440, 1019),
    ("provenance-graph.ts", 1021, 1300),
    ("policy-packs.ts", 1302, 1472),
    ("governance-and-alerts.ts", 1474, 1605),
    ("spine-availability.ts", 1607, 1641),
]

IMPORTS_BY_FILE: dict[str, str] = {
    "eligibility.ts": """import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import {
  SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-created-static-demo";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
""",
    "run-list-and-compare.ts": """import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { RunComparison, RunSummary } from "@/types/authority";

import {
  isDemoRunIdEligibleForStaticFallback,
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
} from "./eligibility";
""",
    "showcase-spine-payloads.ts": """import { canonicalizeDemoRunId, isShowcaseCreatedStaticDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import {
  getShowcaseCreatedStaticDemoPayload,
  SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-created-static-demo";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-static-demo";
import type {
  ArtifactDescriptor,
  ManifestSummary,
  PipelineTimelineItem,
  RunDetail,
  RunDetailAgentResult,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  isDemoRunIdEligibleForStaticFallback,
  isShowcaseSpineStaticPayloadActiveForManifest,
  isShowcaseSpineStaticPayloadActiveForRun,
} from "./eligibility";
""",
    "provenance-graph.ts": """import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
} from "@/lib/showcase-static-demo";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

import {
  isDemoRunIdEligibleForStaticFallback,
  isShowcaseSpineStaticPayloadActiveForRun,
} from "./eligibility";
""",
    "policy-packs.ts": """import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

import { isStaticDemoPayloadFallbackEnabled } from "./eligibility";
""",
    "governance-and-alerts.ts": """import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { AlertRecord } from "@/types/alerts";
import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

import {
  isDemoRunIdEligibleForStaticFallback,
  isStaticDemoPayloadFallbackActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
} from "./eligibility";
""",
    "spine-availability.ts": """import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

import { tryStaticDemoGoldenManifestComparison } from "./run-list-and-compare";
import { tryStaticDemoRunDetail, tryStaticDemoManifestSummary } from "./showcase-spine-payloads";
import { tryStaticDemoProvenanceGraph } from "./provenance-graph";
import { tryStaticDemoGovernanceApprovalRequests } from "./governance-and-alerts";
import { isStaticDemoPayloadFallbackEnabled } from "./eligibility";
""",
}

INDEX_EXPORTS = """
export * from "./eligibility";
export * from "./run-list-and-compare";
export * from "./showcase-spine-payloads";
export * from "./provenance-graph";
export * from "./policy-packs";
export * from "./governance-and-alerts";
export * from "./spine-availability";
""".strip() + "\n"

BARREL = 'export * from "./operator-static-demo/index";\n'


def main() -> None:
    lines = SRC.read_text(encoding="utf-8").splitlines(keepends=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for filename, start, end in SECTIONS:
        body = "".join(lines[start - 1 : end])
        header = IMPORTS_BY_FILE[filename]
        (OUT_DIR / filename).write_text(header + "\n" + body, encoding="utf-8")

    (OUT_DIR / "index.ts").write_text(INDEX_EXPORTS, encoding="utf-8")
    SRC.write_text(BARREL, encoding="utf-8")
    print(f"Wrote {len(SECTIONS)} scenario modules under {OUT_DIR.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
