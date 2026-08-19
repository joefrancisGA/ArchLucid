import { describe, expect, it, vi } from "vitest";

import * as demoUiEnv from "@/lib/demo-ui-env";

import {
  isPackagedDemoDeployEnv,
  isStaticDemoPayloadFallbackActiveForManifest,
  isStaticDemoPayloadFallbackActiveForRun,
  isShowcaseSpineStaticPayloadActiveForRun,
  shouldSeedStaticDemoGovernanceRecordsForRun,
  tryStaticDemoFindingInspect,
  tryStaticDemoGoldenManifestComparison,
  tryStaticDemoRunComparison,
  tryStaticDemoRunDetail,
  tryStaticDemoRunSummariesPaged,
} from "@/lib/operator/operator-static-demo";
import { extractQuickDecisionFindingsFromRunDetail } from "@/lib/quick-decision-summary-derive";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

describe("operator-static-demo — showcase eligibility without demo env vars", () => {
  it("ActiveForRun is false for showcase ids when demo env is unset", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    expect(isStaticDemoPayloadFallbackActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);
    expect(isStaticDemoPayloadFallbackActiveForRun("customer-intake-modernization-run")).toBe(false);
    expect(isStaticDemoPayloadFallbackActiveForRun("claims-intake-run-v1")).toBe(false);
    expect(isStaticDemoPayloadFallbackActiveForRun("not-a-demo-run")).toBe(false);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("ActiveForRun is true for showcase ids when demo env is set", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    expect(isStaticDemoPayloadFallbackActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
    expect(isStaticDemoPayloadFallbackActiveForRun("customer-intake-modernization-run")).toBe(true);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("ActiveForManifest is true only for the showcase manifest UUID when demo env is set", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    expect(isStaticDemoPayloadFallbackActiveForManifest(SHOWCASE_STATIC_DEMO_MANIFEST_ID)).toBe(true);
    expect(isStaticDemoPayloadFallbackActiveForManifest("00000000-0000-0000-0000-000000000001")).toBe(false);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }
  });

  it("tryStaticDemoRunDetail returns payload for showcase run id in buyer-polished shell without demo env", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    const detail = tryStaticDemoRunDetail(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(detail).not.toBeNull();
    expect(detail?.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    }
  });

  it("tryStaticDemoRunDetail returns null for showcase run id in full operator shell outside development", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    const originalNodeEnv = process.env.NODE_ENV;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    process.env.NODE_ENV = "test";

    expect(tryStaticDemoRunDetail(SHOWCASE_STATIC_DEMO_RUN_ID)).toBeNull();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    } else {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    }

    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("tryStaticDemoRunDetail returns payload for showcase run id in full operator shell during local development", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    const originalNodeEnv = process.env.NODE_ENV;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    process.env.NODE_ENV = "development";

    const detail = tryStaticDemoRunDetail(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(detail).not.toBeNull();
    expect(detail?.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    } else {
      delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    }

    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("tryStaticDemoRunDetail returns payload for showcase run id when demo env is set", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const d = tryStaticDemoRunDetail(SHOWCASE_STATIC_DEMO_RUN_ID);

    expect(d).not.toBeNull();
    expect(d?.run.runId).toBe(SHOWCASE_STATIC_DEMO_RUN_ID);

    const quick = extractQuickDecisionFindingsFromRunDetail(d!);
    expect(quick).toHaveLength(9);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }
  });

  it("tryStaticDemoRunSummariesPaged returns null without env when afterAuthorityListFailure is omitted", () => {
    const paged = tryStaticDemoRunSummariesPaged("default");

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true") {
      expect(paged).not.toBeNull();
    } else {
      expect(paged).toBeNull();
    }
  });

  it("tryStaticDemoRunSummariesPaged returns null after authority list failure when demo env is unset", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const paged = tryStaticDemoRunSummariesPaged("default", { afterAuthorityListFailure: true });

    expect(paged).toBeNull();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("tryStaticDemoRunSummariesPaged returns null after empty live list when demo env is unset", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const paged = tryStaticDemoRunSummariesPaged("default", { afterEmptyLiveList: true });

    expect(paged).toBeNull();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("tryStaticDemo compare payloads return null without demo env", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const golden = tryStaticDemoGoldenManifestComparison(
      SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
      SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    );
    const legacy = tryStaticDemoRunComparison(
      SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
      SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    );

    expect(golden).toBeNull();
    expect(legacy).toBeNull();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("shouldSeedStaticDemoGovernanceRecordsForRun is false without packaged demo or buyer-polished shell", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const buyerPolishedSpy = vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(false);

    expect(isPackagedDemoDeployEnv()).toBe(false);
    expect(shouldSeedStaticDemoGovernanceRecordsForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(false);

    buyerPolishedSpy.mockRestore();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("shouldSeedStaticDemoGovernanceRecordsForRun is true for showcase run on buyer-polished diligence spine", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;

    const buyerPolishedSpy = vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);

    expect(isPackagedDemoDeployEnv()).toBe(false);
    expect(shouldSeedStaticDemoGovernanceRecordsForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
    expect(shouldSeedStaticDemoGovernanceRecordsForRun("not-a-demo-run")).toBe(false);

    buyerPolishedSpy.mockRestore();

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }
  });

  it("shouldSeedStaticDemoGovernanceRecordsForRun is true for showcase run id in packaged demo env", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    expect(isPackagedDemoDeployEnv()).toBe(true);
    expect(shouldSeedStaticDemoGovernanceRecordsForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);
    expect(shouldSeedStaticDemoGovernanceRecordsForRun("not-a-demo-run")).toBe(false);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    } else {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    }
  });

  it("isShowcaseSpineStaticPayloadActiveForRun is true for showcase ids in buyer-polished shell without demo env", () => {
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const originalStatic = process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    const originalOperatorExperience = process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;

    expect(isShowcaseSpineStaticPayloadActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(true);

    const inspect = tryStaticDemoFindingInspect(
      SHOWCASE_STATIC_DEMO_RUN_ID,
      SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    );

    expect(inspect).not.toBeNull();
    expect(inspect?.typedPayload.title).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_TITLE);

    if (originalDemo !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }

    if (originalStatic !== undefined) {
      process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR = originalStatic;
    }

    if (originalOperatorExperience !== undefined) {
      process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = originalOperatorExperience;
    }
  });
});
