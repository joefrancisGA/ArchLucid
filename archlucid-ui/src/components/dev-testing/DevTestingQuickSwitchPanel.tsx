"use client";

import { useEffect, useMemo, useState } from "react";

import { DevTestingQuickJumpLinks } from "@/components/dev-testing/DevTestingQuickJumpLinks";
import { useDevTestingQuickJumpSnapshot } from "@/components/dev-testing/use-dev-testing-quick-jump-snapshot";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isOperatorExperienceFullShellEnv,
  isBuyerPolishedOperatorShellEnv,
} from "@/lib/demo-ui-env";
import {
  DEV_QUICK_SWITCH_PANEL_TOGGLE_SHORTCUT,
  useDevQuickSwitchPanelVisibility,
} from "@/lib/dev-quick-switch-panel-visibility";
import {
  isDevTestingOverridesEnabled,
  persistDevRoleOverride,
  persistDevShellExperienceOverride,
  readDevRoleOverrideFromDocument,
  readDevShellExperienceOverrideFromDocument,
  reloadAfterDevTestingOverrideChange,
  type DevRoleOverride,
  type DevShellExperienceOverride,
} from "@/lib/dev-testing-overrides";
import { cn } from "@/lib/utils";

type ShellOption = {
  value: DevShellExperienceOverride | "build-default";
  label: string;
};

type RoleOption = {
  value: DevRoleOverride | "build-default";
  label: string;
};

const SHELL_OPTIONS: ShellOption[] = [
  { value: "buyer-polished", label: "Buyer-polished" },
  { value: "full-operator", label: "Full operator" },
  { value: "build-default", label: "Build default" },
];

const ROLE_OPTIONS: RoleOption[] = [
  { value: "Admin", label: "Admin" },
  { value: "Operator", label: "Operator" },
  { value: "Reader", label: "Reader" },
  { value: "Auditor", label: "Auditor" },
  { value: "build-default", label: "Build default" },
];

function resolveBuildDefaultShellLabel(): string {
  const fullOperator = isOperatorExperienceFullShellEnv(null);

  return fullOperator ? "Full operator" : "Buyer-polished";
}

function selectShellOverride(value: DevShellExperienceOverride | "build-default"): void {
  if (value === "build-default") {
    persistDevShellExperienceOverride(null);
  } else {
    persistDevShellExperienceOverride(value);
  }

  reloadAfterDevTestingOverrideChange();
}

function selectRoleOverride(value: DevRoleOverride | "build-default"): void {
  if (value === "build-default") {
    persistDevRoleOverride(null);
  } else {
    persistDevRoleOverride(value);
  }

  reloadAfterDevTestingOverrideChange();
}

type DevTestingQuickSwitchPanelProps = {
  /** Optional fallback when rendered outside the home workspace activity provider (tests). */
  readonly runIds?: readonly string[];
};

/** Local-dev footer rail — switch shell density and dev-bypass role without restarting Next.js. */
export function DevTestingQuickSwitchPanel(props: DevTestingQuickSwitchPanelProps): React.JSX.Element | null {
  const { recentRunIds: liveRecentRunIds } = useOperatorHomeWorkspaceActivity();
  const runIds = liveRecentRunIds.length > 0 ? liveRecentRunIds : (props.runIds ?? []);
  const { hidden: panelHidden } = useDevQuickSwitchPanelVisibility();
  const [mounted, setMounted] = useState(false);
  const [shellOverride, setShellOverride] = useState<DevShellExperienceOverride | null>(null);
  const [roleOverride, setRoleOverride] = useState<DevRoleOverride | null>(null);
  const { snapshot: quickJumpSnapshot, loading: quickJumpLoading } = useDevTestingQuickJumpSnapshot(runIds);

  useEffect(() => {
    setShellOverride(readDevShellExperienceOverrideFromDocument());
    setRoleOverride(readDevRoleOverrideFromDocument());
    setMounted(true);
  }, []);

  const effectiveShellLabel = useMemo(() => {
    if (shellOverride === "full-operator") {
      return "Full operator";
    }

    if (shellOverride === "buyer-polished") {
      return "Buyer-polished";
    }

    return resolveBuildDefaultShellLabel();
  }, [shellOverride]);

  if (!isDevTestingOverridesEnabled() || !mounted) {
    return null;
  }

  if (panelHidden) {
    return null;
  }

  const buyerPolishedChrome = isBuyerPolishedOperatorShellEnv();

  return (
    <section
      aria-label="Development testing quick switch"
      data-testid="dev-testing-quick-switch"
      className="mt-8 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
    >
      <div className="flex flex-col gap-3">
        <div>
          <h2 className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
            Dev testing quick switch
          </h2>
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Overrides persist in this browser only. Active shell:{" "}
            <strong>{effectiveShellLabel}</strong>
            {roleOverride !== null ? (
              <>
                {" "}
                · role override <strong>{roleOverride}</strong>
              </>
            ) : null}
            {buyerPolishedChrome ? null : " · buyer-polished chrome off (demo build)"}. Press{" "}
            <kbd className="rounded border border-neutral-300 bg-white px-1 py-0.5 font-mono text-[11px] dark:border-neutral-600 dark:bg-neutral-800">
              Alt+Shift+D
            </kbd>{" "}
            to cycle shell modes or{" "}
            <kbd className="rounded border border-neutral-300 bg-white px-1 py-0.5 font-mono text-[11px] dark:border-neutral-600 dark:bg-neutral-800">
              {DEV_QUICK_SWITCH_PANEL_TOGGLE_SHORTCUT}
            </kbd>{" "}
            to hide this panel.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Shell density
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Shell density override">
            {SHELL_OPTIONS.map((option) => {
              const selected =
                option.value === "build-default"
                  ? shellOverride === null
                  : shellOverride === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  data-testid={`dev-shell-option-${option.value}`}
                  aria-pressed={selected}
                  onClick={() => selectShellOverride(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
            Dev role (nav + dev-bypass API)
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dev role override">
            {ROLE_OPTIONS.map((option) => {
              const selected =
                option.value === "build-default" ? roleOverride === null : roleOverride === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  data-testid={`dev-role-option-${option.value}`}
                  aria-pressed={selected}
                  onClick={() => selectRoleOverride(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <DevTestingQuickJumpLinks snapshot={quickJumpSnapshot} loading={quickJumpLoading} />
      </div>
    </section>
  );
}
