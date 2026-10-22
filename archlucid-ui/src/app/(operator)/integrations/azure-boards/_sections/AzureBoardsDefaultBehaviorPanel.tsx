"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { LivelihoodPersistSaveStatus } from "@/components/operator/LivelihoodPersistSaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AZURE_BOARDS_DEFAULT_BEHAVIOR_COLLAPSED_SUMMARY,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_LEAD,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_TITLE,
  AZURE_BOARDS_DEFAULT_BEHAVIOR_UNAVAILABLE_LEAD,
  AZURE_BOARDS_FIELD_AREA_PATH,
  AZURE_BOARDS_FIELD_DEFAULT_TAGS,
  AZURE_BOARDS_FIELD_ITERATION_PATH,
  AZURE_BOARDS_FIELD_PROJECT,
  AZURE_BOARDS_FIELD_WORK_ITEM_TYPE,
  AZURE_BOARDS_SAVE_SETTINGS_LABEL,
  AZURE_BOARDS_SAVING_SETTINGS_LABEL,
} from "@/lib/azure-boards-page-copy";
import type { resolveAzureBoardsPageComposition } from "@/lib/azure-boards-integration-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  azureBoardsDefaultBehaviorCollapsedDisclosureHrefFromSearch,
  parseAzureBoardsDefaultBehaviorCollapsedOpenFromSearch,
} from "@/lib/integrations/azure-boards-default-behavior-collapsed-disclosure-url";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AzureBoardsDefaultBehaviorPanelProps = {
  readonly pageComposition: ReturnType<typeof resolveAzureBoardsPageComposition>;
  readonly canMutate: boolean;
  readonly projects: readonly string[];
  readonly workItemTypes: readonly string[];
  readonly projectName: string;
  readonly onProjectNameChange: (value: string) => void;
  readonly workItemType: string;
  readonly onWorkItemTypeChange: (value: string) => void;
  readonly areaPath: string;
  readonly onAreaPathChange: (value: string) => void;
  readonly iterationPath: string;
  readonly onIterationPathChange: (value: string) => void;
  readonly defaultTags: string;
  readonly onDefaultTagsChange: (value: string) => void;
  readonly discoveryError: string | null;
  readonly saveError: string | null;
  readonly saveSuccess: string | null;
  readonly settingsLastSavedUtc: string | null;
  readonly settingsInlineSaveError: string | null;
  readonly isSaving: boolean;
  readonly onSaveSettings: () => void;
};

export function AzureBoardsDefaultBehaviorPanel({
  pageComposition,
  canMutate,
  projects,
  workItemTypes,
  projectName,
  onProjectNameChange,
  workItemType,
  onWorkItemTypeChange,
  areaPath,
  onAreaPathChange,
  iterationPath,
  onIterationPathChange,
  defaultTags,
  onDefaultTagsChange,
  discoveryError,
  saveError,
  saveSuccess,
  settingsLastSavedUtc,
  settingsInlineSaveError,
  isSaving,
  onSaveSettings,
}: AzureBoardsDefaultBehaviorPanelProps): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/azure-boards";
  const searchParams = useSearchParams();
  const azureBoardsDefaultBehaviorCollapsedOpenParam = searchParams.get("azureBoardsDefaultBehaviorCollapsedOpen");
  const [collapsedOpen, setCollapsedOpenState] = useState(() =>
    parseAzureBoardsDefaultBehaviorCollapsedOpenFromSearch(azureBoardsDefaultBehaviorCollapsedOpenParam),
  );

  const syncCollapsedOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        azureBoardsDefaultBehaviorCollapsedDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setCollapsedOpen = useCallback(
    (open: boolean) => {
      setCollapsedOpenState(open);
      syncCollapsedOpenToUrl(open);
    },
    [syncCollapsedOpenToUrl],
  );

  useEffect(() => {
    setCollapsedOpenState(
      parseAzureBoardsDefaultBehaviorCollapsedOpenFromSearch(azureBoardsDefaultBehaviorCollapsedOpenParam),
    );
  }, [azureBoardsDefaultBehaviorCollapsedOpenParam]);

  if (pageComposition.blocked) {
    return null;
  }

  if (pageComposition.defaultBehaviorCollapsed) {
    return (
      <details
        id="azure-boards-default-behavior-heading"
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="azure-boards-default-behavior-collapsed"
        open={collapsedOpen}
        onToggle={(event) => {
          setCollapsedOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary
          className={cn(
            "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
        >
          {AZURE_BOARDS_DEFAULT_BEHAVIOR_COLLAPSED_SUMMARY}
        </summary>
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_BOARDS_DEFAULT_BEHAVIOR_UNAVAILABLE_LEAD}
        </p>
      </details>
    );
  }

  return (
    <section
      aria-labelledby="azure-boards-default-behavior-heading"
      className={cn("space-y-4 rounded-md border border-neutral-200 p-4 dark:border-neutral-800", OPERATOR_LAYOUT.sectionHeadingStack)}
      data-testid="azure-boards-default-behavior"
    >
      <div>
        <h2 id="azure-boards-default-behavior-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {AZURE_BOARDS_DEFAULT_BEHAVIOR_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AZURE_BOARDS_DEFAULT_BEHAVIOR_LEAD}
        </p>
      </div>

      {discoveryError ? (
        <p className="m-0 text-amber-800 dark:text-amber-200" role="status">
          {discoveryError}
        </p>
      ) : null}

      {saveError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="m-0 text-al-text-secondary dark:text-neutral-200" role="status">
          {saveSuccess}
        </p>
      ) : null}

      <LivelihoodPersistSaveStatus
        lastSavedUtc={settingsLastSavedUtc}
        inlineSaveError={settingsInlineSaveError}
        testId="azure-boards-settings-save-status"
      />

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="azure-boards-project">{AZURE_BOARDS_FIELD_PROJECT}</Label>
          <Select
            value={projectName || undefined}
            onValueChange={onProjectNameChange}
            disabled={!canMutate || isSaving || projects.length === 0}
          >
            <SelectTrigger id="azure-boards-project" data-testid="azure-boards-project-select">
              <SelectValue placeholder={projects.length === 0 ? "Save connection first" : "Select project"} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="azure-boards-work-item-type">{AZURE_BOARDS_FIELD_WORK_ITEM_TYPE}</Label>
          <Select
            value={workItemType || undefined}
            onValueChange={onWorkItemTypeChange}
            disabled={!canMutate || isSaving || workItemTypes.length === 0}
          >
            <SelectTrigger id="azure-boards-work-item-type" data-testid="azure-boards-work-item-type-select">
              <SelectValue placeholder={workItemTypes.length === 0 ? "Select a project first" : "Select type"} />
            </SelectTrigger>
            <SelectContent>
              {workItemTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="azure-boards-area-path">{AZURE_BOARDS_FIELD_AREA_PATH}</Label>
          <Input
            id="azure-boards-area-path"
            value={areaPath}
            onChange={(event) => onAreaPathChange(event.target.value)}
            disabled={!canMutate || isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="azure-boards-iteration-path">{AZURE_BOARDS_FIELD_ITERATION_PATH}</Label>
          <Input
            id="azure-boards-iteration-path"
            value={iterationPath}
            onChange={(event) => onIterationPathChange(event.target.value)}
            disabled={!canMutate || isSaving}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="azure-boards-default-tags">{AZURE_BOARDS_FIELD_DEFAULT_TAGS}</Label>
          <Input
            id="azure-boards-default-tags"
            value={defaultTags}
            onChange={(event) => onDefaultTagsChange(event.target.value)}
            disabled={!canMutate || isSaving}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={pageComposition.saveSettingsVariant}
          onClick={onSaveSettings}
          disabled={isSaving || !canMutate || projectName.trim().length === 0 || workItemType.trim().length === 0}
          title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
          data-testid="azure-boards-save-settings-button"
        >
          {isSaving ? AZURE_BOARDS_SAVING_SETTINGS_LABEL : AZURE_BOARDS_SAVE_SETTINGS_LABEL}
        </Button>
      </div>
    </section>
  );
}
