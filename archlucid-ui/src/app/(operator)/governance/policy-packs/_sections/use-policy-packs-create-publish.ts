"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  assignPolicyPack,
  createPolicyPack,
  publishPolicyPackVersion,
} from "@/lib/api";
import { usePolicyPackVersionDetailQuery } from "@/hooks/use-policy-pack-version-detail-query";
import { usePolicyPackVersionsQuery } from "@/hooks/use-policy-pack-versions-query";
import { policyPackPublishSuccessMessage } from "@/lib/governance/governance-mutation-outcome-copy";
import { showSuccess } from "@/lib/toast";
import type { PolicyPack, PolicyPackContentDocument, PolicyPackVersion } from "@/types/policy-packs";
import { isBundledPlatformDefaultPackType } from "@/lib/policy/policy-pack-type-label";
import { DEFAULT_CONTENT } from "./policy-packs-page-constants";
import type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  parsePolicyPackCompareVersionIdFromSearch,
  parsePolicyPackVersionDiffOpenFromSearch,
  policyPackVersionCompareHrefFromSearch,
} from "@/lib/policy/policy-pack-version-compare-url";
import {
  policyPackSelectionHrefFromSearch,
  parsePolicyPackSelectionFromSearch,
} from "@/lib/policy/policy-pack-selection-url";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";

export function usePolicyPacksCreatePublish(deps: PolicyPacksAuthoringDeps) {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const urlPackId = parsePolicyPackSelectionFromSearch(searchParams.get(POLICY_PACK_ID_QUERY_PARAM));
  const urlShowVersionDiff = parsePolicyPackVersionDiffOpenFromSearch(searchParams.get("diff"));
  const urlCompareLeftId = parsePolicyPackCompareVersionIdFromSearch(searchParams.get("compareLeft"));
  const urlCompareRightId = parsePolicyPackCompareVersionIdFromSearch(searchParams.get("compareRight"));
  const [name, setName] = useState("Baseline governance");
  const [description, setDescription] = useState("");
  const [packType, setPackType] = useState("ProjectCustom");
  const [createJson, setCreateJson] = useState(DEFAULT_CONTENT);

  const [selectedPackId, setSelectedPackIdState] = useState(urlPackId);
  const [publishVersion, setPublishVersion] = useState("1.0.0");
  const [publishJson, setPublishJson] = useState(DEFAULT_CONTENT);

  const [assignVersion, setAssignVersion] = useState("1.0.0");
  const [assignScopeLevel, setAssignScopeLevel] = useState("Project");
  const [assignPinned, setAssignPinned] = useState(false);

  const [packVersions, setPackVersions] = useState<PolicyPackVersion[]>([]);
  const [compareLeftDetail, setCompareLeftDetail] = useState<PolicyPackVersion | null>(null);
  const [compareRightDetail, setCompareRightDetail] = useState<PolicyPackVersion | null>(null);
  const [compareLeftId, setCompareLeftIdState] = useState(urlCompareLeftId);
  const [compareRightId, setCompareRightIdState] = useState(urlCompareRightId);
  const [showVersionDiff, setShowVersionDiffState] = useState(urlShowVersionDiff);
  const [verticalImportSlug, setVerticalImportSlug] = useState<string | null>(null);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const packVersionsQuery = usePolicyPackVersionsQuery(selectedPackId, {
    enabled: selectedPackId.length > 0,
  });
  const latestPackVersion = packVersionsQuery.data?.[0]?.version ?? "";
  const latestVersionDetailQuery = usePolicyPackVersionDetailQuery(selectedPackId, latestPackVersion, {
    enabled: selectedPackId.length > 0 && latestPackVersion.length > 0,
  });
  const publishBaselineJson = latestVersionDetailQuery.data?.contentJson ?? null;
  const compareLeftMeta = packVersions.find((version) => version.policyPackVersionId === compareLeftId);
  const compareRightMeta = packVersions.find((version) => version.policyPackVersionId === compareRightId);
  const compareLeftDetailQuery = usePolicyPackVersionDetailQuery(
    selectedPackId,
    compareLeftMeta?.version ?? "",
    {
      enabled:
        showVersionDiff &&
        selectedPackId.length > 0 &&
        compareLeftMeta !== undefined &&
        compareRightMeta !== undefined &&
        compareLeftId !== compareRightId,
    },
  );
  const compareRightDetailQuery = usePolicyPackVersionDetailQuery(
    selectedPackId,
    compareRightMeta?.version ?? "",
    {
      enabled:
        showVersionDiff &&
        selectedPackId.length > 0 &&
        compareLeftMeta !== undefined &&
        compareRightMeta !== undefined &&
        compareLeftId !== compareRightId,
    },
  );

  const syncPackSelectionToUrl = useCallback(
    (packId: string) => {
      router.replace(policyPackSelectionHrefFromSearch(searchParams.toString(), packId, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const syncVersionCompareToUrl = useCallback(
    (state: { showVersionDiff: boolean; compareLeftId: string; compareRightId: string }) => {
      router.replace(policyPackVersionCompareHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSelectedPackId = useCallback(
    (value: SetStateAction<string>) => {
      setSelectedPackIdState((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncPackSelectionToUrl(resolved);

        return resolved;
      });
    },
    [syncPackSelectionToUrl],
  );

  const setCompareLeftId = useCallback(
    (value: SetStateAction<string>) => {
      setCompareLeftIdState((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncVersionCompareToUrl({ showVersionDiff, compareLeftId: resolved, compareRightId });

        return resolved;
      });
    },
    [compareRightId, showVersionDiff, syncVersionCompareToUrl],
  );

  const setCompareRightId = useCallback(
    (value: SetStateAction<string>) => {
      setCompareRightIdState((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncVersionCompareToUrl({ showVersionDiff, compareLeftId, compareRightId: resolved });

        return resolved;
      });
    },
    [compareLeftId, showVersionDiff, syncVersionCompareToUrl],
  );

  const setShowVersionDiff = useCallback(
    (value: SetStateAction<boolean>) => {
      setShowVersionDiffState((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncVersionCompareToUrl({ showVersionDiff: resolved, compareLeftId, compareRightId });

        return resolved;
      });
    },
    [compareLeftId, compareRightId, syncVersionCompareToUrl],
  );

  useEffect(() => {
    const nextPackId = parsePolicyPackSelectionFromSearch(searchParams.get(POLICY_PACK_ID_QUERY_PARAM));

    if (nextPackId.length > 0) {
      setSelectedPackIdState(nextPackId);
    }
  }, [searchParams]);

  useEffect(() => {
    setShowVersionDiffState(parsePolicyPackVersionDiffOpenFromSearch(searchParams.get("diff")));
    setCompareLeftIdState(parsePolicyPackCompareVersionIdFromSearch(searchParams.get("compareLeft")));
    setCompareRightIdState(parsePolicyPackCompareVersionIdFromSearch(searchParams.get("compareRight")));
  }, [searchParams]);

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

    const versions = packVersionsQuery.data ?? [];
    setPackVersions(versions);
    setPublishJson(DEFAULT_CONTENT);

    const latest = versions[0];

    if (latest) {
      setPublishVersion(latest.version);
      setAssignVersion(latest.version);
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
  }, [packVersionsQuery.data, selectedPackId]);

  useEffect(() => {
    if (!selectedPackId || latestPackVersion.length === 0) {
      return;
    }

    if (latestVersionDetailQuery.data) {
      setPublishJson(latestVersionDetailQuery.data.contentJson || DEFAULT_CONTENT);
    }
  }, [latestPackVersion, latestVersionDetailQuery.data, selectedPackId]);

  useEffect(() => {
    if (!showVersionDiff || !selectedPackId || compareLeftId === compareRightId) {
      setCompareLeftDetail(null);
      setCompareRightDetail(null);

      return;
    }

    if (compareLeftDetailQuery.data && compareRightDetailQuery.data) {
      setCompareLeftDetail(compareLeftDetailQuery.data);
      setCompareRightDetail(compareRightDetailQuery.data);

      return;
    }

    if (compareLeftDetailQuery.isError || compareRightDetailQuery.isError) {
      setCompareLeftDetail(null);
      setCompareRightDetail(null);
    }
  }, [
    compareLeftDetailQuery.data,
    compareLeftDetailQuery.isError,
    compareLeftId,
    compareRightDetailQuery.data,
    compareRightDetailQuery.isError,
    compareRightId,
    selectedPackId,
    showVersionDiff,
  ]);

  const importVerticalPolicyPack = useCallback(async (slug: string, label: string) => {
    deps.setFailure(null);
    setVerticalImportSlug(slug);

    try {
      const response: Response = await fetch(`/vertical-templates/${slug}/policy-pack.json`);

      if (!response.ok) {
        deps.setFailure(uiFailureFromMessage(`${label}: could not load template (HTTP ${response.status}).`));
        return;
      }

      const bodyText: string = await response.text();
      let parsed: unknown;

      try {
        parsed = JSON.parse(bodyText);
      } catch {
        deps.setFailure(uiFailureFromMessage(`${label}: template policy content is invalid.`));
        return;
      }

      const doc = parsed as PolicyPackContentDocument;

      if (!Array.isArray(doc.complianceRuleKeys) || doc.complianceRuleKeys.length === 0) {
        deps.setFailure(uiFailureFromMessage(`${label}: template is missing complianceRuleKeys.`));
        return;
      }

      setCreateJson(JSON.stringify(parsed, null, 2));
      const verticalKey: string = doc.metadata?.vertical ?? slug;
      setName(`${label} (${verticalKey})`);
      setDescription(`Imported vertical starter policy pack (${slug}). Review policy content before publishing.`);
      showSuccess(`${label} template loaded into the create form.`);
    } catch (e: unknown) {
      deps.setFailure(toApiLoadFailure(e));
    } finally {
      setVerticalImportSlug(null);
    }
  }, []);

  const onCreate = useCallback(async () => {
    if (!deps.canMutatePacks) {
      return;
    }

    deps.setFailure(null);

    try {
      JSON.parse(createJson);
    } catch {
      deps.setFailure(uiFailureFromMessage("Create: policy content is invalid."));
      return;
    }

    deps.setLoading(true);

    try {
      const created: PolicyPack = await createPolicyPack({
        name: name.trim() || "Pack",
        description: description.trim(),
        packType,
        initialContentJson: createJson,
      });
      await deps.load();
      // Do not rely only on useEffect(packs): it only runs when selectedPackId is empty, and E2E/CI can race renders.
      setSelectedPackId(created.policyPackId);
    } catch (e) {
      deps.setFailure(toApiLoadFailure(e));
    } finally {
      deps.setLoading(false);
    }
  }, [deps.canMutatePacks, createJson, description, deps.load, name, packType]);

  const onPublish = useCallback(async () => {
    if (!deps.canMutatePacks) {
      return;
    }

    if (!selectedPackId) {
      deps.setFailure(uiFailureFromMessage("Select a pack to publish."));
      return;
    }

    const selectedPack = deps.packs.find((p) => p.policyPackId === selectedPackId);

    if (selectedPack !== undefined && isBundledPlatformDefaultPackType(selectedPack.packType)) {
      deps.setFailure(
        uiFailureFromMessage(
          "Bundled default (platform) packs cannot be republished from Policy packs — clone content into a tenant-owned pack first.",
        ),
      );

      return;
    }

    deps.setFailure(null);
    setPublishSuccessMessage(null);

    try {
      JSON.parse(publishJson);
    } catch {
      deps.setFailure(uiFailureFromMessage("Publish: policy content is invalid."));
      return;
    }

    deps.setLoading(true);

    try {
      await publishPolicyPackVersion(selectedPackId, {
        version: publishVersion.trim(),
        contentJson: publishJson,
      });
      setPublishSuccessMessage(policyPackPublishSuccessMessage(publishVersion));
    } catch (e) {
      setPublishSuccessMessage(null);
      deps.setFailure(toApiLoadFailure(e));
      return;
    } finally {
      deps.setLoading(false);
    }

    try {
      await deps.load();
    } catch (e) {
      deps.setFailure(toApiLoadFailure(e));
    }
  }, [deps.canMutatePacks, deps.load, deps.packs, publishJson, publishVersion, selectedPackId]);

  const onAssign = useCallback(async () => {
    if (!deps.canMutatePacks) {
      return;
    }

    if (!selectedPackId) {
      deps.setFailure(uiFailureFromMessage("Select a pack to assign."));
      return;
    }

    deps.setFailure(null);
    deps.setLoading(true);

    try {
      await assignPolicyPack(selectedPackId, {
        version: assignVersion.trim(),
        scopeLevel: assignScopeLevel,
        isPinned: assignPinned,
      });
      await deps.load();
    } catch (e) {
      deps.setFailure(toApiLoadFailure(e));
    } finally {
      deps.setLoading(false);
    }
  }, [assignPinned, assignScopeLevel, assignVersion, deps.canMutatePacks, deps.load, selectedPackId]);

  const compareLeftVersion = compareLeftDetail ?? packVersions.find((v) => v.policyPackVersionId === compareLeftId);
  const compareRightVersion = compareRightDetail ?? packVersions.find((v) => v.policyPackVersionId === compareRightId);
  const selectedPackSummary = deps.packs.find((p) => p.policyPackId === selectedPackId);

  const bundledPublishBlocked =
    selectedPackSummary !== undefined && isBundledPlatformDefaultPackType(selectedPackSummary.packType);

  const syncPolicyContentJson = useCallback((json: string) => {
    setCreateJson(json);
    setPublishJson(json);
  }, []);

  return {
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
    publishBaselineJson,
  };
}

export type PolicyPacksCreatePublishSlice = ReturnType<typeof usePolicyPacksCreatePublish>;
