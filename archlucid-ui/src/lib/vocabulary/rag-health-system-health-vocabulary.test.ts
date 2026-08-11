import { describe, expect, it } from "vitest";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { INTERNAL_RAG_HEALTH_PATH } from "@/lib/internal-ops-route-paths";
import {
  RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE,
  RAG_HEALTH_SYSTEM_HEALTH_HEADING,
  RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK,
  RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK,
  RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO,
  buildRagHealthSystemHealthVocabulary,
  resolveRagHealthSystemHealthPeerLink,
} from "@/lib/vocabulary/rag-health-system-health-vocabulary";

describe("rag-health-system-health-vocabulary (TB-2285)", () => {
  it("explains why RAG health and system health stay separate and deep-links both", () => {
    const model = buildRagHealthSystemHealthVocabulary();

    expect(model.heading).toBe(RAG_HEALTH_SYSTEM_HEALTH_HEADING);
    expect(model.whyTwo).toBe(RAG_HEALTH_SYSTEM_HEALTH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("corpus");
    expect(model.whyTwo.toLowerCase()).toContain("probe");
    expect(model.compactLine).toBe(RAG_HEALTH_SYSTEM_HEALTH_COMPACT_LINE);

    expect(model.ragHealthLink).toEqual(RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK);
    expect(model.ragHealthLink.href).toBe(INTERNAL_RAG_HEALTH_PATH);
    expect(model.ragHealthLink.href).toBe("/internal/rag-health");

    expect(model.systemHealthLink).toEqual(RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK);
    expect(model.systemHealthLink.href).toBe(ADMINISTRATION_SYSTEM_HEALTH_PATH);
    expect(model.systemHealthLink.href).toBe("/administration/system-health");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveRagHealthSystemHealthPeerLink("rag-health")).toEqual(
      RAG_HEALTH_SYSTEM_HEALTH_SYSTEM_LINK,
    );
    expect(resolveRagHealthSystemHealthPeerLink("system-health")).toEqual(
      RAG_HEALTH_SYSTEM_HEALTH_RAG_LINK,
    );
  });
});
