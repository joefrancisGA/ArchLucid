"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { loadCurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const FINISH_SETUP_STORAGE_KEY = "archlucid.finishSetupWizard.completed.v1";

type SetupStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  isDone: (ctx: SetupContext) => boolean;
};

type SetupContext = {
  healthReady: boolean;
  healthLoadFailed: boolean;
  principalAdmin: boolean;
};

const SETUP_STEPS: SetupStep[] = [
  {
    id: "health",
    label: "Confirm platform health",
    description: "API and database migrations must be healthy before your first review.",
    href: "/admin/health",
    cta: "Open health",
    isDone: (ctx) => ctx.healthReady && !ctx.healthLoadFailed,
  },
  {
    id: "identity",
    label: "Configure identity (OIDC / SAML)",
    description: "Wire your IdP so operators sign in with corporate credentials.",
    href: "/settings/identity/sso-wizard",
    cta: "Open SSO wizard",
    isDone: () => false,
  },
  {
    id: "admin-role",
    label: "Assign initial Admin role",
    description: "Grant at least one operator Admin authority for tenant settings and SCIM.",
    href: "/settings/roles",
    cta: "Manage roles",
    isDone: (ctx) => ctx.principalAdmin,
  },
  {
    id: "extract",
    label: "Upload Azure extractor (optional)",
    description: "Speed up Tier-1 evidence intake with a pre-built extractor ZIP.",
    href: "/settings/extract-upload",
    cta: "Upload extractor",
    isDone: () => false,
  },
];

function readSetupCompleted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FINISH_SETUP_STORAGE_KEY) === "1";
  }
  catch {
    return false;
  }
}

/** Guided post-deploy checklist: health, identity, admin role, optional extractor. */
export function FinishSetupWizardPanel(): React.JSX.Element | null {
  const [ctx, setCtx] = useState<SetupContext>({
    healthReady: false,
    healthLoadFailed: true,
    principalAdmin: false,
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(readSetupCompleted());
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const principal = await loadCurrentPrincipal();
      let healthReady = false;
      let healthLoadFailed = true;

      try {
        const health = await fetchHealthReadySummary();
        healthReady = health !== null && health.status.toLowerCase().includes("healthy");
        healthLoadFailed = health === null;
      }
      catch {
        healthLoadFailed = true;
      }

      if (!cancelled) {
        setCtx({
          healthReady,
          healthLoadFailed,
          principalAdmin: (principal?.authorityRank ?? 0) >= AUTHORITY_RANK.AdminAuthority,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const allRequiredDone = SETUP_STEPS.filter((s) => s.id !== "extract").every((s) => s.isDone(ctx));

  const onMarkComplete = useCallback(() => {
    try {
      window.localStorage.setItem(FINISH_SETUP_STORAGE_KEY, "1");
    }
    catch {
      /* ignore */
    }

    setDismissed(true);
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <section id="finish-setup" className="scroll-mt-24" aria-labelledby="finish-setup-heading" data-testid="finish-setup-wizard">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle id="finish-setup-heading" className="text-base">
              Finish workspace setup
            </CardTitle>
            {allRequiredDone ? <StatusTag kind="ready" label="Required steps complete" /> : <StatusTag kind="needs-attention" label="Setup in progress" />}
          </div>
          <CardDescription>
            Complete these steps after infrastructure deploy so your team can run the first architecture review without manual Key Vault edits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="m-0 list-decimal space-y-3 pl-5">
            {SETUP_STEPS.map((step) => {
              const done = step.isDone(ctx);

              return (
                <li key={step.id} className="text-sm">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{step.label}</span>
                    {done ? <StatusTag kind="ready" label="Done" /> : <StatusTag kind="needs-attention" label="Needs attention" />}
                  </div>
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">{step.description}</p>
                  <Link href={step.href} className="mt-1 inline-block text-sm font-medium text-teal-800 underline dark:text-teal-300">
                    {step.cta} →
                  </Link>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onMarkComplete}>
              Mark setup complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
