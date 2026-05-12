"use client";

import { useCallback, useEffect, useState } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import {
  assignPolicyPack,
  createPolicyPack,
  getEffectivePolicyContent,
  getEffectivePolicyPacks,
  listPolicyPackVersions,
  listPolicyPacks,
  publishPolicyPackVersion,
} from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  isStaticDemoPayloadFallbackEnabled,
  mergePolicyPacksStateWithStaticDemo,
  staticDemoPolicyPacksFallbackBundle,
} from "@/lib/operator-static-demo";
import { showSuccess } from "@/lib/toast";
import { useNavSurface } from "@/lib/use-nav-surface";
import { cn } from "@/lib/utils";
import { PolicyPacksBuyerPolishedAdministratorNote } from "@/app/(operator)/policy-packs/_sections/PolicyPacksBuyerPolishedAdministratorNote";
import { PolicyPacksInspectSection } from "@/app/(operator)/policy-packs/_sections/PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "@/app/(operator)/policy-packs/_sections/PolicyPacksLifecycleSection";
import { PolicyPacksMarketingIntro } from "@/app/(operator)/policy-packs/_sections/PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "@/app/(operator)/policy-packs/_sections/PolicyPacksMetricStrip";
import { PolicyPacksRefreshToolbar } from "@/app/(operator)/policy-packs/_sections/PolicyPacksRefreshToolbar";
import { PolicyPacksRegisteredListSection } from "@/app/(operator)/policy-packs/_sections/PolicyPacksRegisteredListSection";
import { DEFAULT_CONTENT } from "@/app/(operator)/policy-packs/_sections/policy-packs-page-constants";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackContentDocument,
  PolicyPackVersion,
} from "@/types/policy-packs";

export default function PolicyPacksPage() {
  const canMutatePacks = useNavSurface("policy-packs").mutationCapability;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [packs, setPacks] = useState<PolicyPack[]>([]);
  const [effective, setEffective] = useState<EffectivePolicyPackSet | null>(null);
  const [effectiveContent, setEffectiveContent] = useState<PolicyPackContentDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

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
  const [compareLeftId, setCompareLeftId] = useState("");
  const [compareRightId, setCompareRightId] = useState("");
  const [showVersionDiff, setShowVersionDiff] = useState(false);
  const [verticalImportSlug, setVerticalImportSlug] = useState<string | null>(null);

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
          buyerPolishedShell ||
          (p.length === 0 && (eff === null || eff.packs.length === 0)),
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
    }
  }, [buyerPolishedShell]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0]!.policyPackId);
    }
  }, [packs, selectedPackId]);

  useEffect(() => {
    if (!selectedPackId) {
      setPackVersions([]);
      setCompareLeftId("");
      setCompareRightId("");
      setShowVersionDiff(false);

      return;
    }

    void (async () => {
      try {
        const versions = await listPolicyPackVersions(selectedPackId);
        setPackVersions(versions);
        const latest = versions[0];

        if (latest) {
          setPublishVersion(latest.version);
          setPublishJson(latest.contentJson || DEFAULT_CONTENT);
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
      } catch {
        setPackVersions([]);
        setCompareLeftId("");
        setCompareRightId("");
        setShowVersionDiff(false);
      }
    })();
  }, [selectedPackId]);

  async function importVerticalPolicyPack(slug: string, label: string) {
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
  }

  async function onCreate() {
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
  }

  async function onPublish() {
    if (!canMutatePacks) {
      return;
    }

    if (!selectedPackId) {
      setFailure(uiFailureFromMessage("Select a pack to publish."));
      return;
    }
    setFailure(null);
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
      await load();
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAssign() {
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
  }

  const compareLeftVersion = packVersions.find((v) => v.policyPackVersionId === compareLeftId);
  const compareRightVersion = packVersions.find((v) => v.policyPackVersionId === compareRightId);
  const selectedPackSummary = packs.find((p) => p.policyPackId === selectedPackId);

  return (
    <div className="max-w-5xl">
      <LayerHeader pageKey="policy-packs" />
      <OperatorPageHeader title="Policy packs" helpKey="policy-packs" />
      <PolicyPacksMarketingIntro buyerPolishedShell={buyerPolishedShell} canMutatePacks={canMutatePacks} />

      <PolicyPacksMetricStrip
        buyerPolishedShell={buyerPolishedShell}
        packCount={packs.length}
        effective={effective}
        selectedPackSummary={selectedPackSummary}
      />

      <PolicyPacksRefreshToolbar
        buyerPolishedShell={buyerPolishedShell}
        canMutatePacks={canMutatePacks}
        loading={loading}
        onRefresh={load}
      />

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-8", !canMutatePacks && "flex-col-reverse")}>
        <PolicyPacksRegisteredListSection
          buyerPolishedShell={buyerPolishedShell}
          canMutatePacks={canMutatePacks}
          packs={packs}
          selectedPackId={selectedPackId}
          onSelectedPackIdChange={setSelectedPackId}
        />

        {!buyerPolishedShell ? (
          <AdvancedOptionsAccordion className="mb-8">
            <PolicyPacksInspectSection
              canMutatePacks={canMutatePacks}
              selectedPackId={selectedPackId}
              effective={effective}
              effectiveContent={effectiveContent}
              packVersions={packVersions}
              compareLeftId={compareLeftId}
              compareRightId={compareRightId}
              onCompareLeftIdChange={setCompareLeftId}
              onCompareRightIdChange={setCompareRightId}
              showVersionDiff={showVersionDiff}
              setShowVersionDiff={setShowVersionDiff}
              compareLeftVersion={compareLeftVersion}
              compareRightVersion={compareRightVersion}
            />

            {isStaticDemoPayloadFallbackEnabled() || isBuyerPolishedOperatorShellEnv() ? null : (
              <PolicyPacksLifecycleSection
                canMutatePacks={canMutatePacks}
                loading={loading}
                selectedPackId={selectedPackId}
                verticalImportSlug={verticalImportSlug}
                onImportVertical={importVerticalPolicyPack}
                name={name}
                onNameChange={setName}
                description={description}
                onDescriptionChange={setDescription}
                packType={packType}
                onPackTypeChange={setPackType}
                createJson={createJson}
                onCreateJsonChange={setCreateJson}
                onCreate={onCreate}
                publishVersion={publishVersion}
                onPublishVersionChange={setPublishVersion}
                publishJson={publishJson}
                onPublishJsonChange={setPublishJson}
                onPublish={onPublish}
                assignVersion={assignVersion}
                onAssignVersionChange={setAssignVersion}
                assignScopeLevel={assignScopeLevel}
                onAssignScopeLevelChange={setAssignScopeLevel}
                assignPinned={assignPinned}
                onAssignPinnedChange={setAssignPinned}
                onAssign={onAssign}
              />
            )}
          </AdvancedOptionsAccordion>
        ) : (
          <PolicyPacksBuyerPolishedAdministratorNote />
        )}
      </div>
    </div>
  );
}
