import { describe, expect, it } from "vitest";

import {
  canConfirmScopeUnderstanding,
  deriveScopeUnderstandingBullets,
  isScopeBulletEditable,
  isScopeBulletRemovable,
  mergeScopeBulletsIntoBrief,
  normalizeScopeUnderstandingBullets,
  reconcileScopeUnderstandingBullets,
  scopeBulletText,
  scopeConfirmedSummaryMessage,
  validateScopeUnderstandingItem,
  SCOPE_CONTEXT_PREVIEW_MAX_LENGTH,
  SCOPE_ITEM_DUPLICATE_MESSAGE,
  SCOPE_ITEM_MAX_LENGTH,
  SCOPE_ITEM_NO_LETTER_MESSAGE,
  SCOPE_ITEM_TOO_LONG_MESSAGE,
  SCOPE_ITEM_TOO_SHORT_MESSAGE,
  SCOPE_UNDERSTANDING_SECTION_HEADER,
  extractScopeUnderstandingLinesFromBrief,
  scopeBulletsFingerprint,
  scopeUnderstandingFingerprint,
  persistedScopeMatchesBullets,
  stripScopeUnderstandingSection,
  type ScopeUnderstandingBullet,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL } from "@/lib/guided-intake-copy";

function bullet(overrides: Partial<ScopeUnderstandingBullet>): ScopeUnderstandingBullet {
  return {
    id: "custom-1",
    kind: "custom",
    label: "Also in Scope",
    value: "PCI cardholder data zone",
    source: "user",
    ...overrides,
  };
}

describe("scopeBulletBehavior", () => {
  it("allows removal only for operator-added custom rows", () => {
    expect(isScopeBulletRemovable("system")).toBe(false);
    expect(isScopeBulletRemovable("outcome")).toBe(false);
    expect(isScopeBulletRemovable("people")).toBe(false);
    expect(isScopeBulletRemovable("systems")).toBe(false);
    expect(isScopeBulletRemovable("gap")).toBe(false);
    expect(isScopeBulletRemovable("custom")).toBe(true);
  });

  it("keeps people and systems rows read-only mirrors of the actor editor", () => {
    expect(isScopeBulletEditable("people")).toBe(false);
    expect(isScopeBulletEditable("systems")).toBe(false);
    expect(isScopeBulletEditable("system")).toBe(true);
  });
});

describe("deriveScopeUnderstandingBullets", () => {
  it("renders typed rows from fixture brief fields", () => {
    const bullets = deriveScopeUnderstandingBullets({
      architectureName: "Claims intake platform",
      businessOutcome: "Reduce manual claims routing by 30%",
      peopleAndSystems: [
        { label: "Claims adjuster", kind: "Human" },
        { label: "Policy API", kind: "Machine" },
      ],
    });

    expect(bullets.find((entry) => entry.kind === "system")).toMatchObject({
      label: "Primary System or Architecture",
      value: "Claims intake platform",
    });
    expect(bullets.find((entry) => entry.kind === "outcome")?.value).toBe(
      "Reduce manual claims routing by 30%",
    );
    expect(bullets.find((entry) => entry.kind === "people")?.value).toBe("Claims adjuster");
    expect(bullets.find((entry) => entry.kind === "systems")?.value).toBe("Policy API");
  });

  it("lists every confirmed actor in the mirrored people and systems rows", () => {
    const bullets = deriveScopeUnderstandingBullets({
      architectureName: "Vertex",
      peopleAndSystems: [
        { label: "Internal users", kind: "Human" },
        { label: "External users", kind: "Human", trustOrigin: "External" },
        { label: "Machine integration", kind: "Machine" },
        { label: "External API", kind: "Machine", trustOrigin: "External" },
      ],
    });

    expect(bullets.find((entry) => entry.kind === "people")?.value).toBe("Internal users, External users");
    expect(bullets.find((entry) => entry.kind === "systems")?.value).toBe(
      "Machine integration, External API",
    );
  });

  it("keeps the label out of the editable value so rows stay typed", () => {
    const bullets = deriveScopeUnderstandingBullets({ systemName: "Vertex" });
    const systemRow = bullets.find((entry) => entry.kind === "system");

    expect(systemRow?.value).toBe("Vertex");
    expect(systemRow?.value).not.toContain(":");
    expect(scopeBulletText(systemRow!)).toBe("Primary System or Architecture: Vertex");
  });

  it("marks derived rows as inferred so callers can tell edited scope from untouched scope", () => {
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Payments hub",
      businessOutcome: "Improve settlement latency",
    });

    expect(bullets.every((entry) => entry.source === "inferred")).toBe(true);
  });

  it("gives every derived row a stable id so edits survive re-derivation", () => {
    const first = deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "Faster" });
    const second = deriveScopeUnderstandingBullets({ systemName: "Vertex 2", businessOutcome: "Faster" });

    expect(first.map((entry) => entry.id)).toStrictEqual(second.map((entry) => entry.id));
  });

  it("previews a long architecture overview instead of carrying the whole brief", () => {
    const overview = "a".repeat(400);
    const contextRow = deriveScopeUnderstandingBullets({ architectureOverview: overview }).find(
      (entry) => entry.kind === "context",
    );

    expect(contextRow?.value.length).toBeLessThanOrEqual(SCOPE_CONTEXT_PREVIEW_MAX_LENGTH);
    expect(contextRow?.value.endsWith("…")).toBe(true);
  });

  it("ignores a scope block already merged into the brief instead of restating it", () => {
    const merged = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "faster and better" }),
      "faster and better",
    );
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Vertex",
      businessOutcome: merged,
    });

    expect(bullets.some((entry) => entry.value.includes(SCOPE_UNDERSTANDING_SECTION_HEADER))).toBe(false);
    expect(bullets.find((entry) => entry.kind === "outcome")?.value).toBe("faster and better");
  });

  it("falls back to guidance copy when nothing has been entered", () => {
    const bullets = deriveScopeUnderstandingBullets({});

    expect(bullets).toHaveLength(1);
    expect(bullets[0]?.kind).toBe("fallback");
    expect(canConfirmScopeUnderstanding(bullets, {})).toBe(false);
  });

  it("allows scope confirmation once a brief-backed row exists", () => {
    const bullets = deriveScopeUnderstandingBullets({ systemName: "Vertex" });

    expect(canConfirmScopeUnderstanding(bullets, { systemName: "Vertex" })).toBe(true);
  });

  it("blocks scope confirmation when only the default actor row exists", () => {
    const bullets = deriveScopeUnderstandingBullets({
      peopleAndSystems: [{ label: "Primary operator", kind: "Human" }],
    });

    expect(canConfirmScopeUnderstanding(bullets, {})).toBe(false);
  });

  it("allows scope confirmation from an operator-added custom row alone", () => {
    const bullets = deriveScopeUnderstandingBullets({});
    const withCustom = [
      ...bullets.filter((entry) => entry.kind !== "fallback"),
      bullet({ kind: "custom", label: "Also in Scope", value: "PCI cardholder data zone" }),
    ];

    expect(canConfirmScopeUnderstanding(withCustom, {})).toBe(true);
  });

  it("lists unresolved items as out-of-scope rows", () => {
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Vertex",
      missingItemLabels: ["Billing gateway"],
    });

    expect(bullets.find((entry) => entry.kind === "gap")).toMatchObject({
      id: "gap-billing-gateway",
      label: "Out of scope until clarified",
      value: "Billing gateway",
    });
  });
});

describe("stripScopeUnderstandingSection", () => {
  it("removes a merged scope block and the blank line before it", () => {
    const merged = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex" }),
      "Vertex tenant migration.",
    );

    expect(stripScopeUnderstandingSection(merged)).toBe("Vertex tenant migration.");
  });

  it("leaves briefs without a scope block untouched", () => {
    expect(stripScopeUnderstandingSection("Vertex tenant migration.")).toBe("Vertex tenant migration.");
  });

  it("treats missing text as empty", () => {
    expect(stripScopeUnderstandingSection(null)).toBe("");
    expect(stripScopeUnderstandingSection(undefined)).toBe("");
  });
});

describe("scope persistence helpers", () => {
  it("extracts persisted scope lines from a brief field", () => {
    const merged = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "Faster" }),
      "Overview text.",
    );

    expect(extractScopeUnderstandingLinesFromBrief(merged)).toEqual([
      "Primary System or Architecture: Vertex",
      `${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}: Faster`,
    ]);
  });

  it("matches persisted scope to current bullets", () => {
    const bullets = deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "Faster" });
    const merged = mergeScopeBulletsIntoBrief(bullets, "Overview text.");

    expect(persistedScopeMatchesBullets(merged, bullets)).toBe(true);
  });

  it("detects when persisted scope no longer matches current bullets", () => {
    const persisted = mergeScopeBulletsIntoBrief(
      deriveScopeUnderstandingBullets({ systemName: "Vertex" }),
      "Overview text.",
    );
    const current = deriveScopeUnderstandingBullets({ systemName: "Vertex 2" });

    expect(persistedScopeMatchesBullets(persisted, current)).toBe(false);
  });

  it("builds stable fingerprints regardless of line order", () => {
    expect(
      scopeUnderstandingFingerprint([
        "Primary System or Architecture: Vertex",
        `${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}: Faster`,
      ]),
    ).toBe(
      scopeUnderstandingFingerprint([
        `${GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL}: Faster`,
        "Primary System or Architecture: Vertex",
      ]),
    );
    expect(scopeBulletsFingerprint(deriveScopeUnderstandingBullets({ systemName: "Vertex" }))).toContain("vertex");
  });
});

describe("mergeScopeBulletsIntoBrief", () => {
  it("appends confirmed scope rows as labelled lines", () => {
    const bullets = deriveScopeUnderstandingBullets({
      systemName: "Payments hub",
      businessOutcome: "Improve settlement latency",
    });
    const merged = mergeScopeBulletsIntoBrief(bullets, "Base operator brief.");

    expect(merged).toContain("Base operator brief.");
    expect(merged).toContain(SCOPE_UNDERSTANDING_SECTION_HEADER);
    expect(merged).toContain("- Primary System or Architecture: Payments hub");
  });

  it("never merges the architecture context preview back into the brief it came from", () => {
    const overview = "Vertex is a B2B SaaS tenant migration platform. ".repeat(10);
    const bullets = deriveScopeUnderstandingBullets({ systemName: "Vertex", architectureOverview: overview });
    const merged = mergeScopeBulletsIntoBrief(bullets, overview);

    expect(merged).not.toContain("Architecture Context:");
    expect(merged).not.toContain("…");
  });

  it("does not merge placeholder guidance copy", () => {
    const merged = mergeScopeBulletsIntoBrief(deriveScopeUnderstandingBullets({}), "Base brief.");

    expect(merged).toBe("Base brief.");
  });

  it("skips rows the operator cleared", () => {
    const merged = mergeScopeBulletsIntoBrief([bullet({ value: "   " })], "Base brief.");

    expect(merged).toBe("Base brief.");
  });

  it("returns the section alone when the brief is empty", () => {
    const merged = mergeScopeBulletsIntoBrief([bullet({})], "");

    expect(merged.startsWith(SCOPE_UNDERSTANDING_SECTION_HEADER)).toBe(true);
  });

  it("leaves a brief that already carries a scope block untouched", () => {
    const merged = mergeScopeBulletsIntoBrief([bullet({})], `Base brief.\n\n${SCOPE_UNDERSTANDING_SECTION_HEADER}:`);

    expect(merged.endsWith(`${SCOPE_UNDERSTANDING_SECTION_HEADER}:`)).toBe(true);
  });
});

describe("reconcileScopeUnderstandingBullets", () => {
  it("keeps an operator edit when the form above is re-derived", () => {
    const previous = [bullet({ id: "system", kind: "system", label: "Primary System or Architecture", value: "Vertex EU", source: "user" })];
    const inferred = deriveScopeUnderstandingBullets({ systemName: "Vertex" });
    const reconciled = reconcileScopeUnderstandingBullets({ inferred, previous, dismissedIds: [] });

    expect(reconciled.find((entry) => entry.id === "system")?.value).toBe("Vertex EU");
  });

  it("tracks the form again for rows the operator never touched", () => {
    const previous = deriveScopeUnderstandingBullets({ systemName: "Vertex" });
    const inferred = deriveScopeUnderstandingBullets({ systemName: "Vertex 2" });
    const reconciled = reconcileScopeUnderstandingBullets({ inferred, previous, dismissedIds: [] });

    expect(reconciled.find((entry) => entry.id === "system")?.value).toBe("Vertex 2");
  });

  it("refreshes mirrored actor rows even when an older scope edit tried to pin them", () => {
    const inferred = deriveScopeUnderstandingBullets({
      systemName: "Vertex",
      peopleAndSystems: [
        { label: "Machine integration", kind: "Machine" },
        { label: "External API", kind: "Machine" },
      ],
    });
    const previous = inferred.map((entry) =>
      entry.id === "systems"
        ? { ...entry, value: "Machine integration", source: "user" as const }
        : entry,
    );
    const reconciled = reconcileScopeUnderstandingBullets({ inferred, previous, dismissedIds: [] });

    expect(reconciled.find((entry) => entry.id === "systems")?.value).toBe(
      "Machine integration, External API",
    );
  });

  it("preserves operator-added rows and keeps removed rows removed", () => {
    const previous = [
      ...deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "Faster" }),
      bullet({}),
    ];
    const inferred = deriveScopeUnderstandingBullets({ systemName: "Vertex", businessOutcome: "Faster" });
    const reconciled = reconcileScopeUnderstandingBullets({
      inferred,
      previous,
      dismissedIds: ["outcome"],
    });

    expect(reconciled.some((entry) => entry.id === "outcome")).toBe(false);
    expect(reconciled.some((entry) => entry.id === "custom-1")).toBe(true);
  });
});

describe("validateScopeUnderstandingItem", () => {
  it("reports an empty field without an error message", () => {
    expect(validateScopeUnderstandingItem("   ", [])).toStrictEqual({ status: "empty" });
  });

  it("rejects an item too short to review", () => {
    expect(validateScopeUnderstandingItem("ab", [])).toStrictEqual({
      status: "invalid",
      message: SCOPE_ITEM_TOO_SHORT_MESSAGE,
    });
  });

  it("rejects an item longer than a scope line should be", () => {
    expect(validateScopeUnderstandingItem("a".repeat(SCOPE_ITEM_MAX_LENGTH + 1), [])).toStrictEqual({
      status: "invalid",
      message: SCOPE_ITEM_TOO_LONG_MESSAGE,
    });
  });

  it("rejects entries with no letters in them", () => {
    expect(validateScopeUnderstandingItem("1234 !!", [])).toStrictEqual({
      status: "invalid",
      message: SCOPE_ITEM_NO_LETTER_MESSAGE,
    });
  });

  it("rejects a duplicate of an existing row regardless of case", () => {
    expect(validateScopeUnderstandingItem("pci cardholder data zone", [bullet({})])).toStrictEqual({
      status: "invalid",
      message: SCOPE_ITEM_DUPLICATE_MESSAGE,
    });
  });

  it("accepts a plain-language scope item", () => {
    expect(validateScopeUnderstandingItem("Legacy batch loader stays out", [])).toStrictEqual({
      status: "valid",
    });
  });

  it("accepts non-Latin scope items", () => {
    expect(validateScopeUnderstandingItem("決済ゲートウェイ", [])).toStrictEqual({ status: "valid" });
  });
});

describe("normalizeScopeUnderstandingBullets", () => {
  it("trims values and drops rows the operator emptied", () => {
    const normalized = normalizeScopeUnderstandingBullets([
      bullet({ id: "custom-1", value: "  Tenant isolation boundary  " }),
      bullet({ id: "custom-2", value: "   " }),
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.value).toBe("Tenant isolation boundary");
  });
});

describe("scopeConfirmedSummaryMessage", () => {
  it("uses singular copy for one saved line", () => {
    expect(scopeConfirmedSummaryMessage(1)).toBe("1 scope line saved to the intake brief.");
  });

  it("uses plural copy for multiple saved lines", () => {
    expect(scopeConfirmedSummaryMessage(3)).toBe("3 scope lines saved to the intake brief.");
  });
});
