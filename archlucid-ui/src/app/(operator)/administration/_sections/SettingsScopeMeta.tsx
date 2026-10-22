import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { SettingsMasterEditability, SettingsMasterScopeKind, SettingsMasterSourceKind } from "./settings-master-types";

type SettingsScopeMetaProps = {
  readonly scope: SettingsMasterScopeKind;
  readonly source: SettingsMasterSourceKind;
  readonly editability: SettingsMasterEditability;
  readonly saveBehavior?: string;
};

function scopeLabel(scope: SettingsMasterScopeKind): string {
  if (scope === "browser") {
    return "browser";
  }

  if (scope === "user") {
    return "user";
  }

  if (scope === "project") {
    return "project";
  }

  if (scope === "tenant") {
    return "tenant";
  }

  return "workspace";
}

function sourceLabel(source: SettingsMasterSourceKind): string {
  if (source === "inherited") {
    return "inherited from tenant default";
  }

  if (source === "overridden") {
    return "workspace override";
  }

  if (source === "local") {
    return "local to this browser";
  }

  return "product default";
}

function editabilityLabel(editability: SettingsMasterEditability): string {
  if (editability === "read-only") {
    return "read-only";
  }

  if (editability === "admin-only") {
    return "editable by admins";
  }

  return "editable";
}

/** Compact scope, inheritance, and editability row for settings cards. */
export function SettingsScopeMeta(props: SettingsScopeMetaProps) {
  return (
    <dl
      className={cn("m-0 grid gap-1 sm:grid-cols-3", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="settings-scope-meta"
    >
      <div>
        <dt className="sr-only">Scope</dt>
        <dd className="m-0">
          <span className="text-al-text-secondary">Scope:</span>{" "}
          <span className="text-al-text-primary">{scopeLabel(props.scope)}</span>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Source</dt>
        <dd className="m-0">
          <span className="text-al-text-secondary">Source:</span>{" "}
          <span className="text-al-text-primary">{sourceLabel(props.source)}</span>
        </dd>
      </div>
      <div>
        <dt className="sr-only">Status</dt>
        <dd className="m-0">
          <span className="text-al-text-secondary">Status:</span>{" "}
          <span className="text-al-text-primary">{editabilityLabel(props.editability)}</span>
        </dd>
      </div>
      {props.saveBehavior ? (
        <div className="sm:col-span-3">
          <dt className="sr-only">Save behavior</dt>
          <dd className="m-0 text-al-text-secondary">{props.saveBehavior}</dd>
        </div>
      ) : null}
    </dl>
  );
}
