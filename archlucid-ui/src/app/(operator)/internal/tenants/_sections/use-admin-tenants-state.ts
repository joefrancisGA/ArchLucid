"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  adminTenantsActionHrefFromSearch,
  parseAdminTenantActionFromSearch,
  parseAdminTenantIdFromSearch,
} from "@/lib/internal/admin-tenants-action-url";
import { INTERNAL_TENANTS_PATH } from "@/lib/internal-ops-route-paths";
import {
  canProvisionAdminTenantForm,
  listAdminTenants,
  provisionAdminTenant,
  resolveAdminTenantLifecycleStatus,
  suspendAdminTenant,
  unsuspendAdminTenant,
  type AdminTenantRecord,
  type AdminTenantTier,
} from "@/lib/admin-tenants-ops";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export type PendingAdminTenantAction = {
  kind: "shut-off" | "turn-on";
  row: AdminTenantRecord;
};

export type AdminTenantsState = {
  readonly isAuthorityLoading: boolean;
  readonly isAdmin: boolean;
  readonly sortedItems: AdminTenantRecord[];
  readonly error: string | null;
  readonly actionMessage: string | null;
  readonly loading: boolean;
  readonly mutatingId: string | null;
  readonly pendingTenantAction: PendingAdminTenantAction | null;
  readonly name: string;
  readonly setName: (value: string) => void;
  readonly adminEmail: string;
  readonly setAdminEmail: (value: string) => void;
  readonly tier: AdminTenantTier;
  readonly setTier: (value: AdminTenantTier) => void;
  readonly dataRegion: string;
  readonly setDataRegion: (value: string) => void;
  readonly creating: boolean;
  readonly canCreate: boolean;
  readonly refresh: () => Promise<void>;
  readonly onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly onShutOff: (row: AdminTenantRecord) => Promise<void>;
  readonly onTurnOn: (row: AdminTenantRecord) => Promise<void>;
  readonly confirmPendingTenantAction: () => Promise<void>;
  readonly clearPendingTenantAction: () => void;
};

export function useAdminTenantsState(): AdminTenantsState {
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_TENANTS_PATH;
  const searchParams = useSearchParams();
  const urlTenantId = parseAdminTenantIdFromSearch(searchParams.get("tenantId"));
  const urlTenantAction = parseAdminTenantActionFromSearch(searchParams.get("tenantAction"));

  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [items, setItems] = useState<AdminTenantRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pendingTenantAction, setPendingTenantActionState] = useState<PendingAdminTenantAction | null>(null);
  const previousUrlTenantActionRef = useRef(urlTenantAction);
  const previousUrlTenantIdRef = useRef(urlTenantId);

  const syncTenantActionToUrl = useCallback(
    (pending: PendingAdminTenantAction | null) => {
      router.replace(
        adminTenantsActionHrefFromSearch(
          searchParams.toString(),
          pending === null
            ? { tenantId: null, action: null }
            : { tenantId: pending.row.id?.trim() ?? "", action: pending.kind },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingTenantAction = useCallback(
    (value: PendingAdminTenantAction | null) => {
      setPendingTenantActionState(value);
      syncTenantActionToUrl(value);
    },
    [syncTenantActionToUrl],
  );

  const [name, setName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [tier, setTier] = useState<AdminTenantTier>("Standard");
  const [dataRegion, setDataRegion] = useState("default");
  const [creating, setCreating] = useState(false);

  const canCreate = canProvisionAdminTenantForm(name, adminEmail);

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftName = (left.name ?? "").toLocaleLowerCase();
      const rightName = (right.name ?? "").toLocaleLowerCase();

      return leftName.localeCompare(rightName);
    });
  }, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await listAdminTenants();
      setItems(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isAuthorityLoading, refresh]);

  useEffect(() => {
    const tenantActionCleared =
      previousUrlTenantActionRef.current !== null && urlTenantAction === null;
    const tenantIdCleared =
      previousUrlTenantIdRef.current.length > 0 && urlTenantId.length === 0;
    previousUrlTenantActionRef.current = urlTenantAction;
    previousUrlTenantIdRef.current = urlTenantId;

    if ((tenantActionCleared || tenantIdCleared) && pendingTenantAction !== null) {
      setPendingTenantActionState(null);
    }

    if (urlTenantId.length === 0 || urlTenantAction === null || items.length === 0) {
      return;
    }

    const row = items.find((candidate) => (candidate.id?.trim() ?? "") === urlTenantId);

    if (row === undefined) {
      return;
    }

    if (
      pendingTenantAction?.row.id === row.id
      && pendingTenantAction?.kind === urlTenantAction
    ) {
      return;
    }

    setPendingTenantActionState({ kind: urlTenantAction, row });
  }, [items, pendingTenantAction, urlTenantAction, urlTenantId]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate || creating) {
      return;
    }

    setCreating(true);
    setError(null);
    setActionMessage(null);

    try {
      const result = await provisionAdminTenant({
        name: name.trim(),
        adminEmail: adminEmail.trim(),
        tier,
        dataRegion: dataRegion.trim().length > 0 ? dataRegion.trim() : "default",
      });
      setName("");
      setAdminEmail("");
      setActionMessage(
        result.wasAlreadyProvisioned === true
          ? `Tenant already existed (${result.tenantId ?? "unknown id"}). Default packs are already seeded.`
          : `Created tenant ${result.tenantId ?? ""}. Default policy packs were seeded.`,
      );
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create tenant.");
    } finally {
      setCreating(false);
    }
  }

  async function onShutOff(row: AdminTenantRecord) {
    const id = row.id?.trim() ?? "";

    if (id.length === 0 || mutatingId !== null) {
      return;
    }

    setPendingTenantAction({ kind: "shut-off", row });
  }

  async function onTurnOn(row: AdminTenantRecord) {
    const id = row.id?.trim() ?? "";

    if (id.length === 0 || mutatingId !== null) {
      return;
    }

    setPendingTenantAction({ kind: "turn-on", row });
  }

  async function confirmPendingTenantAction(): Promise<void> {
    if (pendingTenantAction === null || mutatingId !== null) {
      return;
    }

    const row = pendingTenantAction.row;
    const id = row.id?.trim() ?? "";

    if (id.length === 0) {
      return;
    }

    setMutatingId(id);
    setError(null);
    setActionMessage(null);

    try {
      if (pendingTenantAction.kind === "shut-off") {
        await suspendAdminTenant(id);
        setActionMessage(`Shut off ${row.name ?? id}.`);
      } else {
        await unsuspendAdminTenant(id);
        setActionMessage(`Turned on ${row.name ?? id}.`);
      }

      setPendingTenantAction(null);
      await refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : pendingTenantAction.kind === "shut-off"
            ? "Failed to shut off tenant."
            : "Failed to turn tenant back on.",
      );
    } finally {
      setMutatingId(null);
    }
  }

  const clearPendingTenantAction = useCallback(() => {
    if (mutatingId === null) {
      setPendingTenantAction(null);
    }
  }, [mutatingId, setPendingTenantAction]);

  return {
    isAuthorityLoading,
    isAdmin,
    sortedItems,
    error,
    actionMessage,
    loading,
    mutatingId,
    pendingTenantAction,
    name,
    setName,
    adminEmail,
    setAdminEmail,
    tier,
    setTier,
    dataRegion,
    setDataRegion,
    creating,
    canCreate,
    refresh,
    onCreate,
    onShutOff,
    onTurnOn,
    confirmPendingTenantAction,
    clearPendingTenantAction,
  };
}
