import { describe, expect, it } from "vitest";

import {
  ALERT_RULES_HUB_DEFERRED_CHUNK_LOADER_IDS,
  ALERTS_INBOX_DEFERRED_CHUNK_LOADER_IDS,
  APP_SHELL_DEFERRED_CHUNK_LOADER_IDS,
  GOVERNANCE_FINDINGS_DEFERRED_CHUNK_LOADER_IDS,
  GOVERNANCE_WORKFLOW_DEFERRED_CHUNK_LOADER_IDS,
  loadDeferredChunkFromManifest,
  MARKETING_DEFERRED_CHUNK_LOADER_IDS,
  OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS,
  OPERATOR_SHELL_TOP_BAR_DEFERRED_CHUNK_LOADER_IDS,
  POLICY_PACKS_AUTHORING_DEFERRED_CHUNK_LOADER_IDS,
  REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS,
  REVIEWS_NEW_DEFERRED_CHUNK_LOADER_IDS,
  RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS,
  SIGNED_RECORDS_LIST_DEFERRED_CHUNK_LOADER_IDS,
  SPONSOR_ROI_DASHBOARD_DEFERRED_CHUNK_LOADER_IDS,
} from "@/lib/operator/load-deferred-chunk-from-manifest";
import { ALERT_RULES_HUB_CHUNK_MANIFEST } from "@/lib/operator/alert-rules-hub-chunk-manifest";
import { ALERTS_INBOX_CHUNK_MANIFEST } from "@/lib/operator/alerts-inbox-chunk-manifest";
import { APP_SHELL_CHUNK_MANIFEST } from "@/lib/operator/app-shell-chunk-manifest";
import { GOVERNANCE_FINDINGS_CHUNK_MANIFEST } from "@/lib/operator/governance-findings-chunk-manifest";
import { GOVERNANCE_WORKFLOW_CHUNK_MANIFEST } from "@/lib/operator/governance-workflow-chunk-manifest";
import { MARKETING_CHUNK_MANIFEST } from "@/lib/operator/marketing-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST } from "@/lib/operator/operator-shell-top-bar-chunk-manifest";
import { POLICY_PACKS_AUTHORING_CHUNK_MANIFEST } from "@/lib/operator/policy-packs-authoring-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { REVIEWS_NEW_CHUNK_MANIFEST } from "@/lib/operator/reviews-new-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";
import { SIGNED_RECORDS_LIST_CHUNK_MANIFEST } from "@/lib/operator/signed-records-list-chunk-manifest";
import { SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST } from "@/lib/operator/sponsor-roi-dashboard-chunk-manifest";

describe("loadDeferredChunkFromManifest (TB-2371)", () => {
  it("registers import loaders for every operator-home manifest entry", () => {
    for (const entry of OPERATOR_HOME_CHUNK_MANIFEST) {
      expect(OPERATOR_HOME_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for reviews-hub manifest entries wired in the loader switch", () => {
    for (const entry of REVIEWS_HUB_CHUNK_MANIFEST) {
      if (!REVIEWS_HUB_DEFERRED_CHUNK_LOADER_IDS.includes(entry.id)) {
        continue;
      }

      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every reviews-new manifest entry", () => {
    for (const entry of REVIEWS_NEW_CHUNK_MANIFEST) {
      expect(REVIEWS_NEW_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every run-detail manifest entry", () => {
    for (const entry of RUN_DETAIL_CHUNK_MANIFEST) {
      expect(RUN_DETAIL_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every governance-workflow manifest entry", () => {
    for (const entry of GOVERNANCE_WORKFLOW_CHUNK_MANIFEST) {
      expect(GOVERNANCE_WORKFLOW_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every governance-findings manifest entry", () => {
    for (const entry of GOVERNANCE_FINDINGS_CHUNK_MANIFEST) {
      expect(GOVERNANCE_FINDINGS_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every policy-packs authoring manifest entry", () => {
    for (const entry of POLICY_PACKS_AUTHORING_CHUNK_MANIFEST) {
      expect(POLICY_PACKS_AUTHORING_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every alert-rules hub manifest entry", () => {
    for (const entry of ALERT_RULES_HUB_CHUNK_MANIFEST) {
      expect(ALERT_RULES_HUB_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every signed-records list manifest entry", () => {
    for (const entry of SIGNED_RECORDS_LIST_CHUNK_MANIFEST) {
      expect(SIGNED_RECORDS_LIST_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every sponsor ROI dashboard manifest entry", () => {
    for (const entry of SPONSOR_ROI_DASHBOARD_CHUNK_MANIFEST) {
      expect(SPONSOR_ROI_DASHBOARD_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every alerts inbox manifest entry", () => {
    for (const entry of ALERTS_INBOX_CHUNK_MANIFEST) {
      expect(ALERTS_INBOX_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every app shell manifest entry", () => {
    for (const entry of APP_SHELL_CHUNK_MANIFEST) {
      expect(APP_SHELL_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every operator shell top bar manifest entry", () => {
    for (const entry of OPERATOR_SHELL_TOP_BAR_CHUNK_MANIFEST) {
      expect(OPERATOR_SHELL_TOP_BAR_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("registers import loaders for every marketing manifest entry", () => {
    for (const entry of MARKETING_CHUNK_MANIFEST) {
      expect(MARKETING_DEFERRED_CHUNK_LOADER_IDS).toContain(entry.id);
      expect(() => loadDeferredChunkFromManifest(entry.id)).not.toThrow();
    }
  });

  it("rejects unknown manifest entry ids", () => {
    expect(() => loadDeferredChunkFromManifest("missing-chunk-id")).toThrow(
      /Unknown deferred chunk manifest entry/,
    );
  });
});
