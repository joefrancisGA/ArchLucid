"use client";

import { ChevronsUpDown } from "lucide-react";
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
import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  BUYER_SCOPE_LIST_UNAVAILABLE,
  BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL,
  BUYER_SCOPE_SWITCHER_INTRO,
  BUYER_WORKSPACE_DISPLAY_NAME,
} from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
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
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_TENANT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { cn } from "@/lib/utils";

const WORKSPACES_PATH = `/api/proxy/${ApiV1Routes.tenantWorkspaces}`;
const SCOPE_PANEL_GAP_PX = 4;
const SCOPE_PANEL_MIN_EDGE_PX = 16;

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

type ProjectOption = { projectId: string; name: string };
type WorkspaceOption = { workspaceId: string; name: string; projects: ProjectOption[] };

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

function parseWorkspacesList(json: unknown): WorkspaceOption[] {
  if (json === null || typeof json !== "object") {
    return [];
  }
  const root = json as WorkspacesListPayload;
  const raw = root.workspaces;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: WorkspaceOption[] = [];
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
    const projects: ProjectOption[] = [];
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

function demoClaimsIntakeWorkspaceOption(): WorkspaceOption {
  return {
    workspaceId: DEV_SCOPE_WORKSPACE_ID,
    name: BUYER_WORKSPACE_DISPLAY_NAME,
    projects: [{ projectId: DEV_SCOPE_PROJECT_ID, name: "Primary project" }],
  };
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
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[] | null>(null);
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
  const isDefaultDevScope =
    workspaceId.trim() === DEV_SCOPE_WORKSPACE_ID && projectId.trim() === DEV_SCOPE_PROJECT_ID;
  const polishedScopeOneLine =
    polishedShell && isDefaultDevScope ? workspaceLabel : polishedShell ? workspaceLabel : null;

  const canShow =
    !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ReadAuthority;

  const refreshList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(WORKSPACES_PATH, mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }));
      if (!res.ok) {
        setWorkspaces(null);
        setListError("Workspace list API is not available yet (expected until GET /v1/tenant/workspaces is implemented).");
        return;
      }
      const json: unknown = await res.json();
      const parsed = parseWorkspacesList(json);
      if (parsed.length === 0) {
        if (isNextPublicDemoMode() || isBuyerPolishedOperatorShellEnv()) {
          setWorkspaces([demoClaimsIntakeWorkspaceOption()]);
          setListError(null);

          return;
        }

        setWorkspaces(null);
        setListError(BUYER_SCOPE_LIST_UNAVAILABLE);

        return;
      }
      setWorkspaces(parsed);
      setListError(null);
    } catch (e) {
      setWorkspaces(null);
      setListError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void refreshList();
    }
  }, [open, refreshList]);

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

  if (!canShow) {
    return null;
  }

  const polishedMaxWidthClass =
    density === "compact" ? "max-w-[min(12rem,28vw)]" : "max-w-[min(22rem,46vw)]";
  const polishedTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(10rem,24vw)]" : "max-w-[min(18rem,38vw)]";
  const scopeTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(12rem,28vw)]" : "max-w-[min(20rem,42vw)]";

  if (polishedShell) {
    const displayLabel =
      isDefaultDevScope ? workspaceLabel : `${workspaceLabel} — ${projectLabel}`;

    return (
      <span className={cn("inline-flex shrink items-center gap-1", polishedMaxWidthClass)}>
        <span className={cn("inline-flex min-w-0 shrink cursor-default items-center gap-2", polishedMaxWidthClass)}>
          <span
            data-testid="operator-scope-switcher-trigger"
            className={cn(
              "inline-flex min-w-0 shrink truncate rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
              polishedTriggerMaxWidthClass,
            )}
            aria-label={`Active workspace: ${displayLabel}`}
          >
            {displayLabel}
          </span>
          {isDefaultDevScope ? (
            <span className="shrink-0 rounded border border-neutral-300 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
              {BUYER_SCOPE_SAMPLE_WORKSPACE_LABEL}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  const scopePanel =
    open && panelStyle != null ? (
      <Card
        ref={panelRef}
        style={panelStyle}
        className="space-y-3 p-3 shadow-lg"
        data-testid="operator-scope-switcher-panel"
        role="dialog"
        aria-label="Workspace and project selection"
      >
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-300">
          {isNextPublicDemoMode() ? BUYER_SCOPE_SWITCHER_INTRO : "Choose the workspace and project for this session."}
        </p>
        {listError !== null ? (
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" data-testid="operator-scope-list-note">
            {listError}
          </p>
        ) : null}
        {workspaces === null && listLoading ? (
          <p className="m-0 text-sm text-neutral-500">Loading workspace list…</p>
        ) : null}
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
      </Card>
    ) : null;

  return (
    <>
      <div className="flex min-w-0 max-w-full shrink items-center gap-1">
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className={cn("min-w-0 max-w-full shrink gap-1 overflow-hidden", scopeTriggerMaxWidthClass)}
          aria-expanded={open}
          aria-haspopup="dialog"
          data-testid="operator-scope-switcher-trigger"
          onClick={() => {
            setOpen((current) => !current);
          }}
        >
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
            {polishedScopeOneLine !== null ? (
              <span className="text-neutral-800 dark:text-neutral-200">{polishedScopeOneLine}</span>
            ) : (
              <>
                <span className="text-neutral-500 dark:text-neutral-400">W:</span> {workspaceLabel}{" "}
                <span className="text-neutral-400 dark:text-neutral-500">/</span>{" "}
                <span className="text-neutral-500 dark:text-neutral-400">P:</span> {projectLabel}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
        <ContextualHelp helpKey="operator-scope-switcher" />
      </div>
      {scopePanel != null && typeof document !== "undefined" ? createPortal(scopePanel, document.body) : null}
    </>
  );
}

function isNonEmptyId(value: string | undefined | null): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}
