"use client";

import type { JSX } from "react";

import {
  buildWorkspaceScopeTenantSettingsVocabulary,
  resolveWorkspaceScopeTenantSettingsPeerLink,
  type WorkspaceScopeTenantSettingsSurfaceId,
  type WorkspaceScopeTenantSettingsVocabularyModel,
} from "@/lib/vocabulary/workspace-scope-tenant-settings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildWorkspaceScopeTenantSettingsVocabulary();
  const peer = resolveWorkspaceScopeTenantSettingsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "workspace-scope"
      ? model.workspaceScopeLink
      : model.tenantSettingsLink;
  const currentLabel = props.currentLabel ?? currentLink.label;

  return (
    <VocabularyRail
      testIdPrefix="workspace-scope-tenant-settings-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLabel}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
