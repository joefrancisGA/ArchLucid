"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  assignPolicyPack,
  createPolicyPack,
  getEffectivePolicyContent,
  getEffectivePolicyPacks,
  getPolicyPackCatalogEntry,
  getPolicyPackVersion,
  listPolicyPackCatalog,
  listPolicyPackVersions,
  listPolicyPacks,
  publishPolicyPackVersion,
} from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  mergePolicyPacksStateWithStaticDemo,
  staticDemoPolicyPacksFallbackBundle,
} from "@/lib/operator-static-demo";
import { policyPackPublishSuccessMessage } from "@/lib/governance/governance-mutation-outcome-copy";
import { showSuccess } from "@/lib/toast";
import { useNavSurface } from "@/lib/use-nav-surface";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackCatalogListItem,
  PolicyPackContentDocument,
  PolicyPackVersion,
} from "@/types/policy-packs";

import { POLICY_PACK_ID_QUERY_PARAM, POLICY_PACKS_TAB_QUERY_PARAM, POLICY_RULE_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import { applyGeneratedCuratedPolicyPack } from "@/lib/apply-generated-curated-policy-pack";
import type { CuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";
import { isBundledPlatformDefaultPackType } from "@/lib/policy/policy-pack-type-label";

import { DEFAULT_CONTENT } from "./policy-packs-page-constants";
import { preloadPolicyRuleAuthoringWizardChunk } from "./policy-packs-authoring-deferred-chunks";
import type { PolicyPacksPageServerLoad } from "./load-policy-packs-page-data";
import type { PolicyPacksPageTab, PolicyPacksPageViewModel } from "./policy-packs-page-view-model";

function pageTabFromQuery(raw: string | null): PolicyPacksPageTab {
  if (raw === "catalog") {
    return "catalog";
  }

  if (raw === "generator") {
    return "generator";
  }

  if (raw === "author") {
    return "author";
  }

  return "my-packs";
}

export function usePolicyPacksPage(serverLoad: PolicyPacksPageServerLoad): PolicyPacksPageViewModel {
  const searchParams = useSearchParams();
  const packIdFromUrl = searchParams.get(POLICY_PACK_ID_QUERY_PARAM)?.trim() ?? "";
  const ruleIdFromUrl = searchParams.get(POLICY_RULE_ID_QUERY_PARAM)?.trim() ?? "";
  const pageTabFromUrl = pageTabFromQuery(searchParams.get(POLICY_PACKS_TAB_QUERY_PARAM));
  const canMutatePacks = useNavSurface("policy-packs").mutationCapability;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [packs, setPacks] = useState<PolicyPack[]>(serverLoad.packs);
  const [effective, setEffective] = useState<EffectivePolicyPackSet | null>(serverLoad.effective);
  const [effectiveContent, setEffectiveContent] = useState<PolicyPackContentDocument | null>(
    serverLoad.effectiveContent,
  );
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => new Date());
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(serverLoad.failure);

  const [pageTab, setPageTab] = useState<PolicyPacksPageTab>(pageTabFromUrl);
  const [generatedRuleCount, setGeneratedRuleCount] = useState(0);
  const [generatedValidationErrors, setGeneratedValidationErrors] = useState<readonly string[]>([]);
  const [authoringWizardInputMode, setAuthoringWizardInputMode] = useState<"guided" | "visual" | "json" | "ai">("guided");
  const [authoringAdvancedOpen, setAuthoringAdvancedOpen] = useState(false);
  const [authoringToolsOpen, setAuthoringToolsOpen] = useState(
    pageTabFromUrl === "author" || pageTabFromUrl === "generator",
  );
  const [catalogItems, setCatalogItems] = useState<PolicyPackCatalogListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFailure, setCatalogFailure] = useState<ApiLoadFailureState | null>(null);
  const [selectedCatalogEntryId, setSelectedCatalogEntryId] = useState("");

  const [name, setName] = useState("Baseline governance");
  const [description, setDescription] = useState("");
  const [packType, setPackType] = useState("ProjectCustom");
  const [createJson, setCreateJson] = useState(DEFAULT_CONTENT);

  const [selectedPackId, setSelectedPackId] = useState("");
  const [publishVersion, setPublishVersion] = useState("1.0.0");
  const [publishJson, setPublishJson] = useState(DEFAULT_CONTENT);

  const [assignVersion, setAssignVersion] = useState("1.0.0");
  const [assignScopeLevel, setAssignScopeLevel] = useState("Project");
  const [assignPinned, setAssignPinned] = useState(false);

  const [packVersions, setPackVersions] = useState<PolicyPackVersion[]>([]);
  const [compareLeftDetail, setCompareLeftDetail] = useState<PolicyPackVersion | null>(null);
  const [compareRightDetail, setCompareRightDetail] = useState<PolicyPackVersion | null>(null);
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");
  const [showVersionDiff, setShowVersionDiff] = useState(false);
  const [verticalImportSlug, setVerticalImportSlug] = useState<string | null>(null);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const [p, eff, doc] = await Promise.all([
        listPolicyPacks(),
        getEffectivePolicyPacks(),
        getEffectivePolicyContent(),
      ]);
      const merged = mergePolicyPacksStateWithStaticDemo(p, eff, doc, "default", {
        afterEmptyLiveResponse:
          buyerPolishedShell || (p.length === 0 && (eff === null || eff.packs.length === 0)),
      });

      setPacks(merged.packs);
      setEffective(merged.effective);
      setEffectiveContent(merged.content);
    } catch (e) {
      const fb = staticDemoPolicyPacksFallbackBundle("default", { afterAuthorityFailure: true });

      if (fb !== null) {
        setPacks(fb.packs);
        setEffective(fb.effective);
        setEffectiveContent(fb.content);
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setLoading(false);
      setLastRefreshedAt(new Date());
    }
  }, [buyerPolishedShell]);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogFailure(null);

    try {
      const rows: PolicyPackCatalogListItem[] = await listPolicyPackCatalog();
      setCatalogItems(rows);

      setSelectedCatalogEntryId((prev) => {
        if (prev.length > 0 && rows.some((r) => r.policyPackCatalogEntryId === prev)) {
          return prev;
        }

        return rows[0]?.policyPackCatalogEntryId ?? "";
      });
    } catch (e: unknown) {
      setCatalogFailure(toApiLoadFailure(e));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pageTab !== "catalog") {
      return;
    }

    void refreshCatalog();
  }, [pageTab, refreshCatalog]);

  const onCloneCatalogEntry = useCallback(async () => {
    if (!canMutatePacks || selectedCatalogEntryId.length === 0) {
      return;
    }

    setCatalogFailure(null);
    setLoading(true);

    try {
      const detail = await getPolicyPackCatalogEntry(selectedCatalogEntryId);
      const json = detail.snapshotContentJson ?? "{}";

      JSON.parse(json);

      const created: PolicyPack = await createPolicyPack({
        name: `${detail.displayName ?? "Catalog pack"} (copy)`,
        description: detail.description ?? "",
        packType: detail.packType ?? "ProjectCustom",
        initialContentJson: json,
      });
      await load();
      setSelectedPackId(created.policyPackId);
      setPageTab("my-packs");
      showSuccess("Cloned catalog pack into your workspace.");
    } catch (e: unknown) {
      setCatalogFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [canMutatePacks, load, selectedCatalogEntryId]);

  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0]!.policyPackId);
    }
  }, [packs, selectedPackId]);

  useEffect(() => {
    if (packIdFromUrl.length === 0) {
      return;
    }

    if (!packs.some((p) => p.policyPackId === packIdFromUrl)) {
      return;
    }

    setSelectedPackId(packIdFromUrl);

    if (pageTabFromUrl === "author") {
      setPageTab("author");
      setAuthoringToolsOpen(true);
      setAuthoringAdvancedOpen(false);

      return;
    }

    setPageTab("my-packs");
  }, [packIdFromUrl, packs, pageTabFromUrl]);

  useEffect(() => {
    if (!selectedPackId) {
      setPackVersions([]);
      setCompareLeftId("");
      setCompareRightId("");
      setCompareLeftDetail(null);
      setCompareRightDetail(null);
      setShowVersionDiff(false);

      return;
    }

    void (async () => {
      try {
        setPublishJson(DEFAULT_CONTENT);
        const versions = await listPolicyPackVersions(selectedPackId);
        setPackVersions(versions);
        const latest = versions[0];

        if (latest) {
          setPublishVersion(latest.version);
          setAssignVersion(latest.version);

          try {
            const detail = await getPolicyPackVersion(selectedPackId, latest.version);
            setPublishJson(detail.contentJson || DEFAULT_CONTENT);
          } catch {
            setPublishJson(DEFAULT_CONTENT);
          }
        }

        if (versions.length >= 2) {
          setCompareLeftId(versions[1]!.policyPackVersionId);
          setCompareRightId(versions[0]!.policyPackVersionId);
        } else if (versions.length === 1) {
          setCompareLeftId(versions[0]!.policyPackVersionId);
          setCompareRightId(versions[0]!.policyPackVersionId);
        } else {
          setCompareLeftId("");
          setCompareRightId("");
        }

        setShowVersionDiff(false);
        setCompareLeftDetail(null);
        setCompareRightDetail(null);
      } catch {
        setPackVersions([]);
        setCompareLeftId("");
        setCompareRightId("");
        setCompareLeftDetail(null);
        setCompareRightDetail(null);
        setShowVersionDiff(false);
      }
    })();
  }, [selectedPackId]);

  useEffect(() => {
    if (!showVersionDiff || !selectedPackId) {
      setCompareLeftDetail(null);
      setCompareRightDetail(null);

      return;
    }

    const leftMeta = packVersions.find((v) => v.policyPackVersionId === compareLeftId);
    const rightMeta = packVersions.find((v) => v.policyPackVersionId === compareRightId);

    if (!leftMeta || !rightMeta || compareLeftId === compareRightId) {
      setCompareLeftDetail(null);
      setCompareRightDetail(null);

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [left, right] = await Promise.all([
          getPolicyPackVersion(selectedPackId, leftMeta.version),
          getPolicyPackVersion(selectedPackId, rightMeta.version),
        ]);

        if (!cancelled) {
          setCompareLeftDetail(left);
          setCompareRightDetail(right);
        }
      } catch {
        if (!cancelled) {
          setCompareLeftDetail(null);
          setCompareRightDetail(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showVersionDiff, selectedPackId, compareLeftId, compareRightId, packVersions]);

  const importVerticalPolicyPack = useCallback(async (slug: string, label: string) => {
    setFailure(null);
    setVerticalImportSlug(slug);

    try {
      const response: Response = await fetch(`/vertical-templates/${slug}/policy-pack.json`);

      if (!response.ok) {
        setFailure(uiFailureFromMessage(`${label}: could not load template (HTTP ${response.status}).`));
        return;
      }

      const bodyText: string = await response.text();
      let parsed: unknown;

      try {
        parsed = JSON.parse(bodyText);
      } catch {
        setFailure(uiFailureFromMessage(`${label}: template policy content is invalid.`));
        return;
      }

      const doc = parsed as PolicyPackContentDocument;

      if (!Array.isArray(doc.complianceRuleKeys) || doc.complianceRuleKeys.length === 0) {
        setFailure(uiFailureFromMessage(`${label}: template is missing complianceRuleKeys.`));
        return;
      }

      setCreateJson(JSON.stringify(parsed, null, 2));
      const verticalKey: string = doc.metadata?.vertical ?? slug;
      setName(`${label} (${verticalKey})`);
      setDescription(`Imported vertical starter policy pack (${slug}). Review policy content before publishing.`);
      showSuccess(`${label} template loaded into the create form.`);
    } catch (e: unknown) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setVerticalImportSlug(null);
    }
  }, []);

  const onCreate = useCallback(async () => {
    if (!canMutatePacks) {
      return;
    }

    setFailure(null);

    try {
      JSON.parse(createJson);
    } catch {
      setFailure(uiFailureFromMessage("Create: policy content is invalid."));
      return;
    }

    setLoading(true);

    try {
      const created: PolicyPack = await createPolicyPack({
        name: name.trim() || "Pack",
        description: description.trim(),
        packType,
        initialContentJson: createJson,
      });
      await load();
      // Do not rely only on useEffect(packs): it only runs when selectedPackId is empty, and E2E/CI can race renders.
      setSelectedPackId(created.policyPackId);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [canMutatePacks, createJson, description, load, name, packType]);

  const onPublish = useCallback(async () => {
    if (!canMutatePacks) {
      return;
    }

    if (!selectedPackId) {
      setFailure(uiFailureFromMessage("Select a pack to publish."));
      return;
    }

    const selectedPack = packs.find((p) => p.policyPackId === selectedPackId);

    if (selectedPack !== undefined && isBundledPlatformDefaultPackType(selectedPack.packType)) {
      setFailure(
        uiFailureFromMessage(
          "Bundled default (platform) packs cannot be republished from Policy packs — clone content into a tenant-owned pack first.",
        ),
      );

      return;
    }

    setFailure(null);
    setPublishSuccessMessage(null);

    try {
      JSON.parse(publishJson);
    } catch {
      setFailure(uiFailureFromMessage("Publish: policy content is invalid."));
      return;
    }

    setLoading(true);

    try {
      await publishPolicyPackVersion(selectedPackId, {
        version: publishVersion.trim(),
        contentJson: publishJson,
      });
      setPublishSuccessMessage(policyPackPublishSuccessMessage(publishVersion));
    } catch (e) {
      setPublishSuccessMessage(null);
      setFailure(toApiLoadFailure(e));
      return;
    } finally {
      setLoading(false);
    }

    try {
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }, [canMutatePacks, load, packs, publishJson, publishVersion, selectedPackId]);

  const onAssign = useCallback(async () => {
    if (!canMutatePacks) {
      return;
    }

    if (!selectedPackId) {
      setFailure(uiFailureFromMessage("Select a pack to assign."));
      return;
    }

    setFailure(null);
    setLoading(true);

    try {
      await assignPolicyPack(selectedPackId, {
        version: assignVersion.trim(),
        scopeLevel: assignScopeLevel,
        isPinned: assignPinned,
      });
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [assignPinned, assignScopeLevel, assignVersion, canMutatePacks, load, selectedPackId]);

  const compareLeftVersion = compareLeftDetail ?? packVersions.find((v) => v.policyPackVersionId === compareLeftId);
  const compareRightVersion = compareRightDetail ?? packVersions.find((v) => v.policyPackVersionId === compareRightId);
  const selectedPackSummary = packs.find((p) => p.policyPackId === selectedPackId);

  const bundledPublishBlocked =
    selectedPackSummary !== undefined && isBundledPlatformDefaultPackType(selectedPackSummary.packType);

  const syncPolicyContentJson = useCallback((json: string) => {
    setCreateJson(json);
    setPublishJson(json);
  }, []);

  useEffect(() => {
    setPageTab(pageTabFromUrl);
  }, [pageTabFromUrl]);

  useEffect(() => {
    if (pageTab === "author" || pageTab === "generator") {
      setAuthoringToolsOpen(true);
    }
  }, [pageTab]);

  const applyGeneratedPolicyPack = useCallback(
    (document: CuratedRulesDocument) => {
      const result = applyGeneratedCuratedPolicyPack({
        document,
        existingName: name,
        existingDescription: description,
        publishVersion,
        packType,
      });

      setGeneratedRuleCount(result.ruleCount);
      setGeneratedValidationErrors(result.validationErrors);

      if (result.validationErrors.length > 0) {
        return;
      }

      setName(result.name);
      setDescription(result.description);
      setPackType(result.packType);
      setPublishVersion(result.publishVersion);
      syncPolicyContentJson(result.contentJson);
    },
    [description, name, packType, publishVersion, syncPolicyContentJson],
  );

  const openAuthoringWizardFromGenerator = useCallback(() => {
    preloadPolicyRuleAuthoringWizardChunk();
    setAuthoringWizardInputMode("visual");
    setAuthoringToolsOpen(true);
    setPageTab("author");

    const deadlineMs = Date.now() + 5000;

    const tryScrollToWizard = () => {
      const wizard = globalThis.document.querySelector("[data-testid='policy-rule-authoring-wizard']");

      if (wizard !== null) {
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (Date.now() < deadlineMs) {
        window.setTimeout(tryScrollToWizard, 100);
      }
    };

    window.setTimeout(tryScrollToWizard, 0);
  }, []);

  const onCreateFromGenerator = useCallback(async () => {
    setPageTab("my-packs");
    await onCreate();
  }, [onCreate]);

  return {
    canMutatePacks,
    buyerPolishedShell,
    pageTab,
    setPageTab,
    catalogItems,
    catalogLoading,
    catalogFailure,
    selectedCatalogEntryId,
    setSelectedCatalogEntryId,
    refreshCatalog,
    onCloneCatalogEntry,
    packs,
    effective,
    effectiveContent,
    loading,
    lastRefreshedAt,
    failure,
    name,
    setName,
    description,
    setDescription,
    packType,
    setPackType,
    createJson,
    setCreateJson,
    selectedPackId,
    setSelectedPackId,
    publishVersion,
    setPublishVersion,
    publishJson,
    setPublishJson,
    assignVersion,
    setAssignVersion,
    assignScopeLevel,
    setAssignScopeLevel,
    assignPinned,
    setAssignPinned,
    packVersions,
    compareLeftId,
    setCompareLeftId,
    compareRightId,
    setCompareRightId,
    showVersionDiff,
    setShowVersionDiff,
    verticalImportSlug,
    bundledPublishBlocked,
    load,
    importVerticalPolicyPack,
    onCreate,
    onPublish,
    onAssign,
    publishSuccessMessage,
    setPublishSuccessMessage,
    compareLeftVersion,
    compareRightVersion,
    selectedPackSummary,
    syncPolicyContentJson,
    ruleIdFromUrl,
    generatedRuleCount,
    generatedValidationErrors,
    applyGeneratedPolicyPack,
    openAuthoringWizardFromGenerator,
    authoringWizardInputMode,
    authoringAdvancedOpen,
    setAuthoringAdvancedOpen,
    authoringToolsOpen,
    setAuthoringToolsOpen,
    onCreateFromGenerator,
  };
}
