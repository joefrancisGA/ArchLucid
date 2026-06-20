"use client";

import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  BUYER_SCOPE_CURRENT_WORKSPACE_BODY,
  BUYER_SCOPE_CURRENT_WORKSPACE_TITLE,
  BUYER_SCOPE_LIST_UNAVAILABLE,
  BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
  BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE,
  BUYER_SCOPE_SWITCHER_CONNECTED_INTRO,
  BUYER_SCOPE_SWITCHER_GOT_IT,
  BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES,
  BUYER_SCOPE_SWITCHER_LOAD_ERROR,
  BUYER_WORKSPACE_DISPLAY_NAME,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  clearOperatorScopeStorage,
  defaultLabelsForScopeIds,
  getEffectiveBrowserProxyScopeHeaders,
  isDevDefaultScopeRecord,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
  writeOperatorScopeToStorage,
} from "@/lib/operator-scope-storage";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatScopeSwitcherSampleFullTitle,
  formatScopeSwitcherTriggerAccessibleLabel,
  formatScopeSwitcherTriggerLabel,
  isScopeSwitchingAvailable,
  type ScopeSwitcherWorkspaceOption,
} from "@/lib/scope-switcher-display";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { cn } from "@/lib/utils";

const WORKSPACES_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;
const SCOPE_PANEL_GAP_PX = 4;
const SCOPE_PANEL_MIN_EDGE_PX = 16;
const SCOPE_SWITCHER_HELP_HREF = "/help/scope";

type ScopePanelMode = "loading" | "selector" | "sample-info" | "current-scope-info" | "error";

function computeScopePanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const maxWidth = Math.min(352, window.innerWidth - SCOPE_PANEL_MIN_EDGE_PX * 2);
  const width = maxWidth;
  const left = Math.max(SCOPE_PANEL_MIN_EDGE_PX, rect.right - width);

  return {
    position: "fixed",
    zIndex: 100,
    top: rect.bottom + SCOPE_PANEL_GAP_PX,
    left,
    width,
    maxWidth: "min(22rem, calc(100vw - 2rem))",
  };
}

type WorkspacesListPayload = {
  workspaces?: ReadonlyArray<{
    workspaceId?: string;
    id?: string;
    name?: string;
    displayName?: string;
    projects?: ReadonlyArray<{
      projectId?: string;
      id?: string;
      name?: string;
      displayName?: string;
    }>;
  }>;
};

function parseWorkspacesList(json: unknown): ScopeSwitcherWorkspaceOption[] {
  if (json === null || typeof json !== "object") {
    return [];
  }
  const root = json as WorkspacesListPayload;
  const raw = root.workspaces;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ScopeSwitcherWorkspaceOption[] = [];
  for (const w of raw) {
    if (w === null || typeof w !== "object") {
      continue;
    }
    const wid = (w as { workspaceId?: string; id?: string }).workspaceId ?? (w as { id?: string }).id;
    if (typeof wid !== "string" || wid.trim().length === 0) {
      continue;
    }
    const wname =
      typeof w.displayName === "string" && w.displayName.trim().length > 0
        ? w.displayName.trim()
        : typeof w.name === "string" && w.name.trim().length > 0
          ? w.name.trim()
          : "Workspace";
    const projects: ScopeSwitcherWorkspaceOption["projects"][number][] = [];
    const prows = w.projects;
    if (Array.isArray(prows)) {
      for (const p of prows) {
        if (p === null || typeof p !== "object") {
          continue;
        }
        const pid = (p as { projectId?: string; id?: string }).projectId ?? (p as { id?: string }).id;
        if (typeof pid !== "string" || pid.trim().length === 0) {
          continue;
        }
        const pname =
          typeof p.displayName === "string" && p.displayName.trim().length > 0
            ? p.displayName.trim()
            : typeof p.name === "string" && p.name.trim().length > 0
              ? p.name.trim()
              : "Project";
        projects.push({ projectId: pid.trim(), name: pname });
      }
    }
    out.push({ workspaceId: wid.trim(), name: wname, projects });
  }
  return out;
}

function demoClaimsIntakeWorkspaceOption(): ScopeSwitcherWorkspaceOption {
  return {
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    name: BUYER_WORKSPACE_DISPLAY_NAME,
    projects: [{ projectId: DEV_SCOPE_PROJECT_ID, name: "Primary project" }],
  };
}

function isEffectiveDevDefaultScope(
  workspaceId: string,
  projectId: string,
): boolean {
  return (
    workspaceId.trim() === DEV_SCOPE_WORKSPACE_ID &&
    projectId.trim() === DEV_SCOPE_PROJECT_ID
  );
}

function shouldUseSampleWorkspaceFallback(
  workspaceId: string,
  projectId: string,
): boolean {
  return isEffectiveDevDefaultScope(workspaceId, projectId);
}

type ScopeSwitcherProps = {
  readonly density?: "default" | "compact";
};

/**
 * Header control: show current workspace/project, persist scope to `localStorage`, and send scope on `/api/proxy` requests
 * (see `getEffectiveBrowserProxyScopeHeaders`).
 */
export function ScopeSwitcher(props: ScopeSwitcherProps) {
  const density = props.density ?? "default";
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<ScopeSwitcherWorkspaceOption[] | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const effective = useMemo(() => {
    void tick;
    return getEffectiveBrowserProxyScopeHeaders();
  }, [tick]);
  const stored = useMemo(() => {
    void tick;
    return readOperatorScopeFromStorage();
  }, [tick]);
  const tenantId = effective["x-tenant-id"] ?? "";
  const workspaceId = effective["x-workspace-id"] ?? "";
  const projectId = effective["x-project-id"] ?? "";

  const { workspaceLabel, projectLabel } = useMemo(() => {
    const d = defaultLabelsForScopeIds(workspaceId, projectId);
    if (stored === null) {
      return { workspaceLabel: d.workspace, projectLabel: d.project };
    }
    const w = stored.workspaceLabel.length > 0 ? stored.workspaceLabel : d.workspace;
    const p = stored.projectLabel.length > 0 ? stored.projectLabel : d.project;
    return { workspaceLabel: w, projectLabel: p };
  }, [stored, workspaceId, projectId]);

  const polishedShell = isBuyerPolishedOperatorShellEnv();
  const isSampleWorkspaceSession = isEffectiveDevDefaultScope(workspaceId, projectId);
  const switchingAvailable = isScopeSwitchingAvailable(workspaces);

  const triggerLabel = formatScopeSwitcherTriggerLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession,
    includeProject: !isSampleWorkspaceSession,
  });

  const triggerAccessibleLabel = formatScopeSwitcherTriggerAccessibleLabel({
    workspaceLabel,
    projectLabel,
    isSampleWorkspaceSession,
    includeProject: !isSampleWorkspaceSession,
  });

  const sampleFullTitle = formatScopeSwitcherSampleFullTitle();

  const canShow =
    !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ReadAuthority;

  const applySampleWorkspaceFallback = useCallback(() => {
    setWorkspaces([demoClaimsIntakeWorkspaceOption()]);
    setListError(null);
  }, []);

  const refreshList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const useSampleFallback = shouldUseSampleWorkspaceFallback(workspaceId, projectId);

    try {
      const res = await fetch(WORKSPACES_PATH, mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));
      if (!res.ok) {
        if (useSampleFallback) {
          applySampleWorkspaceFallback();

          return;
        }

        setWorkspaces(null);
        setListError(BUYER_SCOPE_SWITCHER_LOAD_ERROR);

        return;
      }
      const json: unknown = await res.json();
      const parsed = parseWorkspacesList(json);

      if (parsed.length === 0) {
        if (useSampleFallback) {
          applySampleWorkspaceFallback();

          return;
        }

        setWorkspaces(null);
        setListError(BUYER_SCOPE_SWITCHER_LOAD_ERROR);

        return;
      }

      setWorkspaces(parsed);
      setListError(null);
    } catch (e) {
      if (useSampleFallback) {
        applySampleWorkspaceFallback();

        return;
      }

      setWorkspaces(null);
      setListError(e instanceof Error ? e.message : BUYER_SCOPE_SWITCHER_LOAD_ERROR);
    } finally {
      setListLoading(false);
    }
  }, [applySampleWorkspaceFallback, projectId, workspaceId]);

  useEffect(() => {
    if (open) {
      void refreshList();
    }
  }, [open, refreshList]);

  const panelMode: ScopePanelMode = useMemo(() => {
    if (listLoading && workspaces === null) {
      return "loading";
    }

    if (listError !== null && !isSampleWorkspaceSession) {
      return "error";
    }

    if (switchingAvailable) {
      return "selector";
    }

    if (isSampleWorkspaceSession) {
      return "sample-info";
    }

    return "current-scope-info";
  }, [isSampleWorkspaceSession, listError, listLoading, switchingAvailable, workspaces]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (trigger == null) {
      return;
    }

    setPanelStyle(computeScopePanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPanelStyle(null);

      return;
    }

    updatePanelPosition();

    window.addEventListener("scroll", updatePanelPosition, true);
    window.addEventListener("resize", updatePanelPosition);

    return () => {
      window.removeEventListener("scroll", updatePanelPosition, true);
      window.removeEventListener("resize", updatePanelPosition);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const applyScope = useCallback(
    (row: OperatorScopeRecord) => {
      writeOperatorScopeToStorage(row);
      setTick((n) => n + 1);
      setOpen(false);
    },
    [],
  );

  const closePanel = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  if (!canShow) {
    return null;
  }

  const polishedMaxWidthClass =
    density === "compact" ? "max-w-[min(12.5rem,32vw)]" : "max-w-[min(22rem,46vw)]";
  const polishedTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(12.5rem,32vw)]" : "max-w-[min(18rem,38vw)]";
  const scopeTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(12.5rem,32vw)]" : "max-w-[min(20rem,42vw)]";
  const scopeTriggerLabelClass =
    "min-w-0 flex-1 truncate whitespace-nowrap text-left text-xs font-medium text-neutral-800 dark:text-neutral-200";

  const scopePanel =
    open && panelStyle != null ? (
      <Card
        ref={panelRef}
        style={panelStyle}
        className="space-y-3 p-3 shadow-lg"
        data-testid="operator-scope-switcher-panel"
        role="dialog"
        aria-label={
          panelMode === "selector"
            ? "Workspace and project selection"
            : panelMode === "sample-info"
              ? BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE
              : panelMode === "current-scope-info"
                ? BUYER_SCOPE_CURRENT_WORKSPACE_TITLE
                : "Workspace scope"
        }
      >
        {panelMode === "loading" ? (
          <p className="m-0 text-sm text-neutral-500">Loading workspaces…</p>
        ) : null}
        {panelMode === "current-scope-info" ? (
          <>
            <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {BUYER_SCOPE_CURRENT_WORKSPACE_TITLE}
            </p>
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
              {BUYER_SCOPE_CURRENT_WORKSPACE_BODY}
            </p>
            <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {triggerLabel}
            </p>
            <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
              {BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT}
            </p>
            <Button type="button" size="sm" onClick={closePanel}>
              {BUYER_SCOPE_SWITCHER_GOT_IT}
            </Button>
          </>
        ) : null}
        {panelMode === "sample-info" ? (
          <>
            <div className="flex flex-wrap items-start gap-2">
              <p className="m-0 min-w-0 flex-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {sampleFullTitle}
              </p>
              <span className="shrink-0 rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                Sample
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
                {BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT}
              </p>
              <p
                className="m-0 text-sm text-neutral-600 dark:text-neutral-300"
                data-testid="operator-scope-sample-info-body"
              >
                {BUYER_SCOPE_SAMPLE_WORKSPACE_BODY}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Button type="button" size="sm" onClick={closePanel}>
                {BUYER_SCOPE_SWITCHER_GOT_IT}
              </Button>
              <Link
                href={SCOPE_SWITCHER_HELP_HREF}
                className={cn(
                  "text-xs font-medium text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline",
                  "dark:text-neutral-400 dark:hover:text-neutral-200",
                )}
              >
                {BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES}
              </Link>
            </div>
          </>
        ) : null}
        {panelMode === "error" ? (
          <>
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300" data-testid="operator-scope-list-note">
              {listError ?? BUYER_SCOPE_SWITCHER_LOAD_ERROR}
            </p>
            <details className="rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-700">
              <summary className="cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-200">
                Technical details
              </summary>
              <p className="mt-2 mb-0 text-neutral-600 dark:text-neutral-400">
                {BUYER_SCOPE_LIST_UNAVAILABLE}
              </p>
            </details>
            <Button type="button" size="sm" variant="secondary" onClick={closePanel}>
              {BUYER_SCOPE_SWITCHER_GOT_IT}
            </Button>
          </>
        ) : null}
        {panelMode === "selector" ? (
          <>
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
              {BUYER_SCOPE_SWITCHER_CONNECTED_INTRO}
            </p>
            {workspaces !== null && workspaces.length > 0 ? (
              <div className="max-h-64 space-y-2 overflow-y-auto" role="list" aria-label="Workspaces and projects">
                {workspaces.map((ws) => {
                  if (ws.projects.length === 0) {
                    return null;
                  }

                  return (
                    <div key={ws.workspaceId} className="space-y-1">
                      <p className="m-0 truncate text-xs font-semibold text-neutral-700 dark:text-neutral-200">{ws.name}</p>
                      {ws.projects.map((pr) => {
                        return (
                          <Button
                            key={pr.projectId}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 w-full justify-start truncate"
                            onClick={() => {
                              const scopeTenantId = isNonEmptyId(tenantId) ? tenantId.trim() : DEV_SCOPE_TENANT_ID;

                              applyScope({
                                tenantId: scopeTenantId,
                                workspaceId: ws.workspaceId,
                                projectId: pr.projectId,
                                workspaceLabel: ws.name,
                                projectLabel: pr.name,
                              });
                            }}
                          >
                            {pr.name}
                          </Button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : null}
            {stored !== null && !isDevDefaultScopeRecord(stored) ? (
              <div className="space-y-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
                <Label className="text-xs text-neutral-500">Override</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full"
                  onClick={() => {
                    clearOperatorScopeStorage();
                    setTick((n) => n + 1);
                    setOpen(false);
                  }}
                >
                  Clear custom scope
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
    ) : null;

  if (polishedShell) {
    return (
      <>
        <span className={cn("inline-flex shrink items-center", polishedMaxWidthClass)}>
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            className={cn(
              "inline-flex h-auto min-w-0 shrink cursor-pointer items-center gap-2 p-0 font-normal hover:bg-transparent",
              polishedMaxWidthClass,
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            data-testid="operator-scope-switcher-trigger"
            aria-label={triggerAccessibleLabel}
            title={triggerAccessibleLabel}
            onClick={() => {
              setOpen((current) => !current);
            }}
          >
            <span
              className={cn(
                "inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                polishedTriggerMaxWidthClass,
              )}
            >
              <span className={scopeTriggerLabelClass}>{triggerLabel}</span>
              <ChevronsUpDown className="size-3 shrink-0 opacity-50" aria-hidden />
            </span>
          </Button>
        </span>
        {scopePanel != null && typeof document !== "undefined" ? createPortal(scopePanel, document.body) : null}
      </>
    );
  }

  return (
    <>
      <div className="flex min-w-0 max-w-full shrink items-center">
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className={cn("min-w-0 max-w-full shrink gap-1 overflow-hidden", scopeTriggerMaxWidthClass)}
          aria-expanded={open}
          aria-haspopup="dialog"
          data-testid="operator-scope-switcher-trigger"
          aria-label={triggerAccessibleLabel}
          title={triggerAccessibleLabel}
          onClick={() => {
            setOpen((current) => !current);
          }}
        >
          <span className={scopeTriggerLabelClass}>{triggerLabel}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </div>
      {scopePanel != null && typeof document !== "undefined" ? createPortal(scopePanel, document.body) : null}
    </>
  );
}

function isNonEmptyId(value: string | undefined | null): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
