import { PolicyPackContentJsonEditor } from "@/components/PolicyPackContentJsonEditor";
import { InfoTooltip } from "@/components/InfoTooltip";
import { GovernanceDryRunModal } from "@/components/GovernanceDryRunModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  enterpriseMutationControlDisabledTitle,
  policyPacksAssignButtonLabelReaderRank,
  policyPacksCreatePackButtonLabelReaderRank,
  policyPacksLifecycleLeadReaderLine,
  policyPacksPublishButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { cn } from "@/lib/utils";
import { PACK_TYPES, VERTICAL_POLICY_PACK_IMPORTS } from "./policy-packs-page-constants";

export type PolicyPacksLifecycleSectionProps = {
  canMutatePacks: boolean;
  loading: boolean;
  selectedPackId: string;
  verticalImportSlug: string | null;
  bundledPublishBlocked: boolean;
  onImportVertical: (slug: string, label: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  packType: string;
  onPackTypeChange: (value: string) => void;
  createJson: string;
  onCreateJsonChange: (value: string) => void;
  onCreate: () => void;
  publishVersion: string;
  onPublishVersionChange: (value: string) => void;
  publishJson: string;
  onPublishJsonChange: (value: string) => void;
  onPublish: () => void;
  assignVersion: string;
  onAssignVersionChange: (value: string) => void;
  assignScopeLevel: string;
  onAssignScopeLevelChange: (value: string) => void;
  assignPinned: boolean;
  onAssignPinnedChange: (value: boolean) => void;
  onAssign: () => void;
};

export function PolicyPacksLifecycleSection(props: PolicyPacksLifecycleSectionProps) {
  const {
    canMutatePacks,
    loading,
    selectedPackId,
    verticalImportSlug,
    bundledPublishBlocked,
    onImportVertical,
    name,
    onNameChange,
    description,
    onDescriptionChange,
    packType,
    onPackTypeChange,
    createJson,
    onCreateJsonChange,
    onCreate,
    publishVersion,
    onPublishVersionChange,
    publishJson,
    onPublishJsonChange,
    onPublish,
    assignVersion,
    onAssignVersionChange,
    assignScopeLevel,
    onAssignScopeLevelChange,
    assignPinned,
    onAssignPinnedChange,
    onAssign,
  } = props;

  return (
    <section className="mb-0" aria-labelledby="policy-packs-lifecycle-heading">
      <h3 id="policy-packs-lifecycle-heading">
        {canMutatePacks ? "Lifecycle actions" : "Lifecycle actions (operator writes)"}
      </h3>
      {canMutatePacks ? null : (
        <p className="text-neutral-500 dark:text-neutral-400 text-xs max-w-3xl mt-1 mb-2">
          {policyPacksLifecycleLeadReaderLine}
        </p>
      )}
      <div className={cn(!canMutatePacks && "opacity-90")}>
        <div className="mb-8">
          <GovernanceDryRunModal policyPackId={selectedPackId} />
        </div>
        <section className="mb-8" aria-labelledby="policy-packs-vertical-import-heading">
          <h4 id="policy-packs-vertical-import-heading" className="mt-0 mb-2">
            Import a vertical policy pack
          </h4>
          <p className="mb-3 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
            Loads the starter <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">policy-pack.json</code>{" "}
            shipped under{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">archlucid-ui/public/vertical-templates/</code>{" "}
            (mirrors <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">templates/policy-packs/</code> in
            the repo). Fills the create form below — adjust name and policy content, then create and publish.
          </p>
          <div className="mb-2 flex flex-wrap gap-2">
            {VERTICAL_POLICY_PACK_IMPORTS.map((row) => (
              <Button
                key={row.slug}
                type="button"
                size="sm"
                variant="secondary"
                disabled={verticalImportSlug !== null || !canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                onClick={() => void onImportVertical(row.slug, row.label)}
              >
                {verticalImportSlug === row.slug ? "Loading…" : row.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h4 className="mt-0 mb-2">Create pack</h4>
          <div className="grid gap-2.5 max-w-3xl">
            <div className="space-y-2">
              <label htmlFor="policy-pack-create-name" className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Name
              </label>
              <Input
                id="policy-pack-create-name"
                value={name}
                onChange={(e) => {
                  onNameChange(e.target.value);
                }}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="policy-pack-create-description"
                className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                Description
              </label>
              <Input
                id="policy-pack-create-description"
                value={description}
                onChange={(e) => {
                  onDescriptionChange(e.target.value);
                }}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1"
              />
            </div>
            <label className="flex items-center gap-2">
              Pack type
              <InfoTooltip text="Determines the pack's origin and mutability. ProjectCustom allows full editing." />
              <select
                value={packType}
                onChange={(e) => {
                  onPackTypeChange(e.target.value);
                }}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="block w-full p-2 mt-1"
              >
                {PACK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <PolicyPackContentJsonEditor
              id="policy-pack-create-json"
              label="Initial content (policy)"
              value={createJson}
              onChange={onCreateJsonChange}
              readOnly={!canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
            />
            <button
              type="button"
              onClick={() => void onCreate()}
              disabled={loading || !canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              className={cn(
                !canMutatePacks &&
                  "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
              )}
            >
              {canMutatePacks ? "Create pack" : policyPacksCreatePackButtonLabelReaderRank}
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h4 className="mt-0 mb-2">Publish version</h4>
          {bundledPublishBlocked ? (
            <p className="mb-2 max-w-prose rounded-md border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-neutral-900 dark:border-amber-900/55 dark:bg-amber-950/40 dark:text-amber-100">
              Selected pack is <strong className="font-semibold">Bundled default (platform)</strong>: ArchLucid seeded it at tenant onboarding. Published versions upgrade with product releases —
              tenants cannot mint new SemVer revisions from Policy packs UI (API blocks republish too). Customize by copying JSON into a{" "}
              <strong className="font-semibold">Project custom</strong> pack.
            </p>
          ) : null}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Creates a published version row and marks the pack Active. Use a new semantic version when content changes.
          </p>
          <div className="grid gap-2.5 max-w-3xl">
            <div className="space-y-2">
              <label
                htmlFor="policy-pack-publish-version"
                className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                Version label
              </label>
              <Input
                id="policy-pack-publish-version"
                value={publishVersion}
                onChange={(e) => {
                  onPublishVersionChange(e.target.value);
                }}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1"
              />
            </div>
            <PolicyPackContentJsonEditor
              id="policy-pack-publish-json"
              label="Content (policy)"
              value={publishJson}
              onChange={onPublishJsonChange}
              readOnly={!canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
            />
            <button
              type="button"
              onClick={() => void onPublish()}
              disabled={loading || !selectedPackId || !canMutatePacks || bundledPublishBlocked}
              title={
                bundledPublishBlocked
                  ? "Bundled default packs cannot be republished from Policy packs."
                  : canMutatePacks
                    ? undefined
                    : enterpriseMutationControlDisabledTitle
              }
              className={cn(
                !canMutatePacks &&
                  "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
              )}
            >
              {canMutatePacks ? "Publish" : policyPacksPublishButtonLabelReaderRank}
            </button>
          </div>
        </section>

        <section className="mb-0">
          <h4 className="mt-0 mb-2">Assign to current scope</h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Assignment must reference an existing version string for that pack (e.g. the one you published).
          </p>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="space-y-2">
              <label
                htmlFor="policy-pack-assign-version"
                className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
              >
                Version
              </label>
              <Input
                id="policy-pack-assign-version"
                value={assignVersion}
                onChange={(e) => {
                  onAssignVersionChange(e.target.value);
                }}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="mt-1 w-40"
              />
            </div>
            <label className="flex items-center gap-2">
              Scope level
              <InfoTooltip text="The organizational level where this policy pack applies (Tenant, Workspace, or Project)." />
              <select
                value={assignScopeLevel}
                onChange={(e) => onAssignScopeLevelChange(e.target.value)}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="block p-2 mt-1 min-w-[140px]"
              >
                <option value="Tenant">Tenant</option>
                <option value="Workspace">Workspace</option>
                <option value="Project">Project</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={assignPinned}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                onChange={(e) => onAssignPinnedChange(e.target.checked)}
              />
              Pinned
              <InfoTooltip text="Pinned assignments prevent lower scopes from overriding this policy pack." />
            </label>
            <button
              type="button"
              onClick={() => void onAssign()}
              disabled={loading || !selectedPackId || !canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              className={cn(
                !canMutatePacks &&
                  "rounded border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-400",
              )}
            >
              {canMutatePacks ? "Assign" : policyPacksAssignButtonLabelReaderRank}
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
