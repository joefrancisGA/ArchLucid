"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Settings2 } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";

type SidebarNavLayoutSettingsPanelProps = {
  readonly showSidebarCustomizationChrome: boolean;
  readonly settingsOpen: boolean;
  readonly onSettingsOpenChange: (open: boolean) => void;
  readonly navAllFeaturesExpanded: boolean;
  readonly shellShowAdvanced: boolean;
  readonly showExtended: boolean;
  readonly showAdvanced: boolean;
  readonly onToggleShowAdvanced: () => void;
  readonly onShowExtendedChange: (checked: boolean) => void;
  readonly onShowAdvancedChange: (checked: boolean) => void;
};

export function SidebarNavLayoutSettingsPanel(
  props: SidebarNavLayoutSettingsPanelProps,
): ReactElement | null {
  if (!props.showSidebarCustomizationChrome) {
    return null;
  }

  return (
    <>
      <div className="mt-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("sidebar-disclosure-trigger w-full justify-start gap-2 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
          data-onboarding="tour-nav-settings"
          aria-haspopup="dialog"
          aria-expanded={props.settingsOpen}
          onClick={() => {
            props.onSettingsOpenChange(true);
          }}
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Sidebar layout
        </Button>

        {!props.navAllFeaturesExpanded ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("sidebar-disclosure-trigger mt-2 w-full justify-start px-3 py-2 text-left font-medium text-neutral-900 shadow-none hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="sidebar-show-advanced-operations-toggle"
            aria-pressed={props.shellShowAdvanced}
            aria-label={
              props.shellShowAdvanced
                ? NAV_DISCLOSURE.advancedOperationsSidebar.hide
                : `${NAV_DISCLOSURE.advancedOperationsSidebar.show}. ${NAV_DISCLOSURE.advancedOperationsSidebar.assistiveCollapsed}`
            }
            onClick={() => {
              props.onToggleShowAdvanced();
            }}
          >
            {props.shellShowAdvanced
              ? NAV_DISCLOSURE.advancedOperationsSidebar.hide
              : NAV_DISCLOSURE.advancedOperationsSidebar.show}
          </Button>
        ) : null}
      </div>

      <Dialog open={props.settingsOpen} onOpenChange={props.onSettingsOpenChange}>
        <DialogContent className="max-w-md" data-testid="sidebar-layout-settings-dialog">
          <DialogHeader>
            <DialogTitle>Sidebar layout</DialogTitle>
            <DialogDescription>
              Control which sidebar links appear by progressive disclosure tier. The same destination list also
              respects optional minimum API access-level hints (Read / Operator / Admin) when the shell can resolve your
              principal via <code className={OPERATOR_TYPOGRAPHY.helper}>GET /api/auth/me</code>; the command palette (Ctrl+K) uses the
              same tier + access-level composition (see <code className={OPERATOR_TYPOGRAPHY.helper}>nav-shell-visibility.ts</code>).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="nav-extended">{NAV_DISCLOSURE.extended.show}</Label>
                <p className={cn("text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                  <strong>Advanced Analysis:</strong> compare, replay, graph, architecture advisory, evaluation feedback,
                  recommendation tuning.{" "}
                  <strong>Admin:</strong> baseline and workspace settings.{" "}
                  <strong>Enterprise Controls:</strong> policy packs, governance dashboard, governance resolution.
                </p>
              </div>
              <input
                id="nav-extended"
                data-testid="sidebar-layout-nav-extended"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
                aria-label={NAV_DISCLOSURE.extended.show}
                checked={props.showExtended}
                onChange={(event) => {
                  props.onShowExtendedChange(event.target.checked);
                }}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="nav-advanced">{NAV_DISCLOSURE.advanced.show}</Label>
                <p className={cn("text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                  <strong>Enterprise Controls:</strong> audit log, Alerts hub, governance workflow, schedules, and deeper
                  trust surfaces — independent from analysis & investigation links.
                </p>
              </div>
              <input
                id="nav-advanced"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
                aria-label={NAV_DISCLOSURE.advanced.show}
                checked={props.showAdvanced}
                onChange={(event) => {
                  props.onShowAdvancedChange(event.target.checked);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
