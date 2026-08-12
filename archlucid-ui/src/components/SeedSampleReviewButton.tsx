"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import {
  BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS,
} from "@/lib/buyer-polish-copy";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import {
  invalidateOperatorExecutiveRoiCaches,
  invalidateOperatorHomeRunsCaches,
} from "@/lib/operator-query-invalidation";
import { showError, showSuccess } from "@/lib/toast";

/**
 * V1 Operator Shell — OS-1 (LATEST.md improvement #1).
 *
 * Reviews-empty-state CTA that POSTs to the internal `/api/seed-sample` route handler. On success the route
 * returns `{ redirectTo: "/architecture/executive-dashboard" }`; we invalidate dashboard caches, then navigate when the target differs
 * from the current path. Errors surface via the shared sonner toast (`showError`) — the button stays interactive.
 *
 * Static showcase / `SampleFirstReviewPackageCard` flows are intentionally untouched.
 */

const SEED_SAMPLE_ROUTE = "/api/seed-sample";

const FALLBACK_ERROR_MESSAGE = "Could not load the sample workspace. Please try again.";

export type SeedSampleReviewButtonProps = {
  readonly className?: string;
  /** Optional override for the visible label (defaults to "Load sample workspace"). */
  readonly label?: string;
  /** Defaults to outline — this CTA is usually secondary to start-review or demo-review actions. */
  readonly variant?: NonNullable<ButtonProps["variant"]>;
  readonly size?: NonNullable<ButtonProps["size"]>;
};

type SeedSampleResponse = {
  readonly redirectTo?: unknown;
};

function isSeedSampleResponse(value: unknown): value is SeedSampleResponse {
  return typeof value === "object" && value !== null;
}

function readRedirectTarget(payload: unknown): string | null {
  if (!isSeedSampleResponse(payload)) {
    return null;
  }

  const target = payload.redirectTo;

  if (typeof target !== "string") {
    return null;
  }

  const trimmed = target.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function pathnameOnly(href: string): string {
  return href.split("?")[0]?.split("#")[0] ?? href;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (isSeedSampleResponse(body) && typeof (body as { detail?: unknown }).detail === "string") {
      const detail = (body as { detail: string }).detail.trim();

      if (detail.length > 0) {
        return detail;
      }
    }
  } catch {
    // Non-JSON or empty body — fall through to the generic message below.
  }

  return `${FALLBACK_ERROR_MESSAGE} (status ${response.status})`;
}

export function SeedSampleReviewButton({
  className,
  label = BUYER_SEED_SAMPLE_WORKSPACE_CTA,
  variant = "outline",
  size = "default",
}: SeedSampleReviewButtonProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch(SEED_SAMPLE_ROUTE, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        showError(detail);

        return;
      }

      const payload: unknown = await response.json();
      const target = readRedirectTarget(payload) ?? EXECUTIVE_DASHBOARD_HREF;
      const targetPathname = pathnameOnly(target);
      const currentPathname = pathnameOnly(pathname);

      await Promise.all([invalidateOperatorExecutiveRoiCaches(), invalidateOperatorHomeRunsCaches()]);

      if (currentPathname !== targetPathname) {
        router.push(target);
      }

      router.refresh();
      showSuccess(BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS);
    } catch (err: unknown) {
      const message = err instanceof Error && err.message.trim().length > 0 ? err.message : FALLBACK_ERROR_MESSAGE;
      showError(message);
    } finally {
      setBusy(false);
    }
  }, [pathname, router]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      aria-busy={busy}
      data-testid="seed-sample-review-button"
      className={className}
      onClick={() => {
        void onClick();
      }}
    >
      {busy ? "Seeding sample…" : label}
    </Button>
  );
}
