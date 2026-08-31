"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import { BUYER_UNLOAD_SAMPLE_WORKSPACE_CTA, BUYER_UNLOAD_SAMPLE_WORKSPACE_SUCCESS } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import {
  invalidateOperatorSponsorRoiCaches,
  invalidateOperatorHomeRunsCaches,
} from "@/lib/operator/operator-query-invalidation";
import { showError, showSuccess } from "@/lib/toast";

const PURGE_SAMPLE_ROUTE = "/api/purge-sample";

const FALLBACK_ERROR_MESSAGE = "Could not remove the sample dashboard. Please try again.";

export type UnloadSampleReviewButtonProps = {
  readonly className?: string;
  readonly label?: string;
  readonly variant?: NonNullable<ButtonProps["variant"]>;
  readonly size?: NonNullable<ButtonProps["size"]>;
};

type PurgeSampleResponse = {
  readonly redirectTo?: unknown;
  readonly detail?: unknown;
};

function isPurgeSampleResponse(value: unknown): value is PurgeSampleResponse {
  return typeof value === "object" && value !== null;
}

function readRedirectTarget(payload: unknown): string | null {
  if (!isPurgeSampleResponse(payload)) {
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

    if (isPurgeSampleResponse(body) && typeof body.detail === "string") {
      const detail = body.detail.trim();

      if (detail.length > 0) {
        return detail;
      }
    }
  } catch {
    // Non-JSON or empty body — fall through to the generic message below.
  }

  return `${FALLBACK_ERROR_MESSAGE} (status ${response.status})`;
}

/** Removes seeded sample runs and refreshes sponsor dashboard caches (OS-1 companion to seed). */
export function UnloadSampleReviewButton({
  className,
  label = BUYER_UNLOAD_SAMPLE_WORKSPACE_CTA,
  variant = "outline",
  size = "default",
}: UnloadSampleReviewButtonProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    setBusy(true);

    try {
      const response = await fetch(PURGE_SAMPLE_ROUTE, {
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
      const target = readRedirectTarget(payload) ?? SPONSOR_DASHBOARD_HREF;
      const targetPathname = pathnameOnly(target);
      const currentPathname = pathnameOnly(pathname);

      await Promise.all([invalidateOperatorSponsorRoiCaches(), invalidateOperatorHomeRunsCaches()]);

      if (currentPathname !== targetPathname) {
        router.push(target);
      } else {
        router.replace(target, { scroll: false });
      }

      router.refresh();
      showSuccess(BUYER_UNLOAD_SAMPLE_WORKSPACE_SUCCESS);
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
      data-testid="unload-sample-review-button"
      className={className}
      onClick={() => {
        void onClick();
      }}
    >
      {busy ? "Removing sample…" : label}
    </Button>
  );
}
