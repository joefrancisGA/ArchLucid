"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildWorkspaceScopeTenantSettingsPairwiseRail,
  buildWorkspaceScopeTenantSettingsVocabulary,
  type WorkspaceScopeTenantSettingsSurfaceId,
  type WorkspaceScopeTenantSettingsVocabularyModel,
} from "@/lib/vocabulary/workspace-scope-tenant-settings-vocabulary";

export type WorkspaceScopeTenantSettingsVocabularyRailProps = {
  readonly currentSurfaceId: WorkspaceScopeTenantSettingsSurfaceId;
  /** Overrides the resolved current-surface label (e.g. "Workspace settings" on the workspace-settings route). */
  readonly currentLabel?: string;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: WorkspaceScopeTenantSettingsVocabularyModel;
};

/** TB-2317 — Workspace scope switcher vs Tenant settings. */
export function WorkspaceScopeTenantSettingsVocabularyRail(
  props: WorkspaceScopeTenantSettingsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.workspaceScopeLink,
          peerLink: props.model.tenantSettingsLink,
        }
      : buildWorkspaceScopeTenantSettingsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="workspace-scope-tenant-settings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
      currentLabelOverride={props.currentLabel}
    />
  );
}
