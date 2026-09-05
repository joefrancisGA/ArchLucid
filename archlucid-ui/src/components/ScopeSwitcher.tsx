"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS } from "@/lib/design-tokens";

import { ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { ScopeSwitcherPanelBody } from "@/components/ScopeSwitcherPanelBody";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BUYER_SCOPE_CURRENT_WORKSPACE_TITLE,
  BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE,
  BUYER_SCOPE_SWITCHER_LOAD_ERROR,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  clearOperatorScopeStorage,
  defaultLabelsForScopeIds,
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
  writeOperatorScopeToStorage,
} from "@/lib/operator/operator-scope-storage";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatScopeSwitcherSampleFullTitle,
  formatScopeSwitcherTriggerAccessibleLabel,
  formatScopeSwitcherTriggerLabel,
  isEffectiveDevDefaultScope,
  isScopeSwitchingAvailable,
  type ScopeSwitcherWorkspaceOption,
} from "@/lib/scope-switcher-display";
import {
  computeScopePanelStyle,
  type ScopePanelMode,
} from "@/components/scope-switcher-panel-style";
import {
  demoClaimsIntakeWorkspaceOption,
  parseWorkspacesList,
  shouldUseSampleWorkspaceFallback,
  WORKSPACES_PATH,
} from "@/components/scope-switcher-workspace-list";
import {
  parseScopeSwitcherOpenFromSearch,
  scopeSwitcherHrefFromSearch,
} from "@/lib/operator/scope-switcher-url";

type ScopeSwitcherProps = {
  readonly density?: "default" | "compact";
};

/**
 * Header control: show current workspace/project, persist scope to `localStorage`, and send scope on `/api/proxy` requests
 * (see `getEffectiveBrowserProxyScopeHeaders`).
 */
export function ScopeSwitcher(props: ScopeSwitcherProps) {
  const density = props.density ?? "default";
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const scopeOpenParam = searchParams.get("scopeOpen");
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const [open, setOpenState] = useState(() => parseScopeSwitcherOpenFromSearch(scopeOpenParam));
  const [tick, setTick] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<ScopeSwitcherWorkspaceOption[] | null>(null);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const syncScopeOpenToUrl = useCallback(
    (popoverOpen: boolean) => {
      router.replace(scopeSwitcherHrefFromSearch(searchParams.toString(), popoverOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncScopeOpenToUrl(next);

        return next;
      });
    },
    [syncScopeOpenToUrl],
  );

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
  }, [open, setOpen]);

  const applyScope = useCallback(
    (row: OperatorScopeRecord) => {
      writeOperatorScopeToStorage(row);
      setTick((n) => n + 1);
      setOpen(false);
    },
    [setOpen],
  );

  const closePanel = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  const clearCustomScope = useCallback(() => {
    clearOperatorScopeStorage();
    setTick((n) => n + 1);
    setOpen(false);
  }, [setOpen]);

  if (!canShow) {
    return null;
  }

  const polishedMaxWidthClass =
    density === "compact" ? "max-w-[min(16rem,38vw)]" : "max-w-[min(22rem,46vw)]";
  const polishedTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(16rem,38vw)]" : "max-w-[min(18rem,38vw)]";
  const scopeTriggerMaxWidthClass =
    density === "compact" ? "max-w-[min(16rem,38vw)]" : "max-w-[min(20rem,42vw)]";
  const scopeTriggerLabelClass =
    density === "compact"
      ? "min-w-0 flex-1 truncate whitespace-nowrap text-left text-neutral-900 dark:text-neutral-100"
      : "min-w-0 flex-1 truncate whitespace-nowrap text-left text-neutral-800 dark:text-neutral-200";

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
        <ScopeSwitcherPanelBody
          open={open}
          panelMode={panelMode}
          listLoading={listLoading}
          listError={listError}
          workspaces={workspaces}
          stored={stored}
          triggerLabel={triggerLabel}
          sampleFullTitle={sampleFullTitle}
          tenantId={tenantId}
          workspaceId={workspaceId}
          projectId={projectId}
          onClose={closePanel}
          onApplyScope={applyScope}
          onClearCustomScope={clearCustomScope}
        />
      </Card>
    ) : null;

  if (polishedShell) {
    return (
      <>
        <span className={cn("inline-flex shrink items-center", polishedMaxWidthClass)}>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            className={cn(
              "inline-flex min-w-0 shrink cursor-pointer items-center gap-2 overflow-hidden border-0 p-0 shadow-none hover:bg-transparent",
              OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS,
              polishedMaxWidthClass,
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            id="operator-scope-switcher"
            data-testid="operator-scope-switcher-trigger"
            aria-label={triggerAccessibleLabel}
            title={triggerAccessibleLabel}
            onClick={() => {
              setOpen((current) => !current);
            }}
          >
            <span
              className={cn(
                "inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden rounded-md border border-neutral-200 bg-white px-2.5 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
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
          className={cn(
            "min-w-0 max-w-full shrink gap-1 overflow-hidden",
            OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS,
            scopeTriggerMaxWidthClass,
          )}
          aria-expanded={open}
          aria-haspopup="dialog"
          id="operator-scope-switcher"
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
