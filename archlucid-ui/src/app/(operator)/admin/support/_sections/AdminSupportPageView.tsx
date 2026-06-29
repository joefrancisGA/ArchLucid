"use client";
import { cn } from "@/lib/utils";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { Button } from "@/components/ui/button";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

import type { UseAdminSupportPageModel } from "./use-admin-support-page";

type AdminSupportPageViewProps = {
  model: UseAdminSupportPageModel;
};

const BUNDLE_INCLUDED_ITEMS = [
  "Workspace and tenant identifiers",
  "App version, runtime, and host environment",
  "Feature flags and configuration readiness",
  "Redacted ARCHLUCID_* and DOTNET_* environment variables (secret-shaped names show set / not set only)",
  "Diagnostics summary and automated triage hints",
  "Correlation reference hints",
] as const;

const BUNDLE_NOT_INCLUDED_ITEMS = [
  "Secrets, API keys, or bearer tokens",
  "Connection-string passwords or email addresses",
  "Raw uploaded evidence",
  "Full customer documents",
] as const;

export function AdminSupportPageView({ model }: AdminSupportPageViewProps) {
  const { downloading, error, isDemo, onDownload } = model;

  if (isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Support tools"
        description="In a connected tenant, operators download redacted support bundles and attach them to tickets."
      />
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Support</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Get help, download diagnostics, and review troubleshooting resources.
        </p>
      </div>

      <Section title="Contact support">
        <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          For questions before sharing diagnostics, contact{" "}
          <a className={OPERATOR_LINK.nav} href="mailto:support@archlucid.net">
            support@archlucid.net
          </a>
          .
        </p>
      </Section>

      <Section title="Support bundle">
        <p className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Download a redacted diagnostics bundle to attach to a support ticket. The bundle contains redacted diagnostic
          context that an administrator may choose to share with support.
        </p>

        <div className="mt-4 space-y-3">
          <Button
            type="button"
            data-testid="admin-support-download-bundle"
            disabled={downloading}
            onClick={() => void onDownload()}
          >
            {downloading ? "Preparing bundle…" : "Download support bundle"}
          </Button>

          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Download requires appropriate API permissions for your tenant. Review the bundle before sharing outside your
            organization.
          </p>

          {error !== null ? (
            <p
              role="alert"
              className={cn(
                "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
              data-testid="admin-support-download-error"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <BundleDisclosure summary="What's included" items={BUNDLE_INCLUDED_ITEMS} />
          <BundleDisclosure summary="Not included" items={BUNDLE_NOT_INCLUDED_ITEMS} />
        </div>
      </Section>

      <Section title="Troubleshooting">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <ResourceLink href="/admin/health" label="Open system health" />
          <ResourceLink href={inAppHelpHref("troubleshooting")} label="Open troubleshooting guide" />
          <ResourceLink href={inAppHelpHref("admin-diagnostics")} label="View admin diagnostics" />
        </div>
      </Section>
    </div>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className={cn("mb-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>{title}</h2>
      {children}
    </section>
  );
}

type BundleDisclosureProps = {
  summary: string;
  items: readonly string[];
};

function BundleDisclosure({ summary, items }: BundleDisclosureProps) {
  return (
    <details className="group rounded border border-neutral-200 dark:border-neutral-800">
      <summary className={cn("cursor-pointer select-none list-none px-3 py-2 text-al-text-primary hover:text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {summary}
      </summary>
      <ul className="space-y-1 px-3 pb-3 pt-1">
        {items.map((item) => (
          <li key={item} className={cn("flex items-start gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="mt-0.5 shrink-0 text-al-text-secondary" aria-hidden>
              –
            </span>
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

type ResourceLinkProps = {
  href: string;
  label: string;
};

function ResourceLink({ href, label }: ResourceLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-medium text-al-text-primary hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.tab,
      )}
    >
      {label}
    </Link>
  );
}
