"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { Button } from "@/components/ui/button";
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
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Support</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Get help, download diagnostics, and review troubleshooting resources.
        </p>
      </div>

      <Section title="Contact support">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          For questions before sharing diagnostics, contact{" "}
          <a className="text-teal-800 underline dark:text-teal-300" href="mailto:support@archlucid.net">
            support@archlucid.net
          </a>
          .
        </p>
      </Section>

      <Section title="Support bundle">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
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

          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Download requires appropriate API permissions for your tenant. Review the bundle before sharing outside your
            organization.
          </p>

          {error !== null ? (
            <p
              role="alert"
              className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50"
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
      <h2 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
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
      <summary className="cursor-pointer select-none list-none px-3 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100">
        {summary}
      </summary>
      <ul className="space-y-1 px-3 pb-3 pt-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-600" aria-hidden>
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
      className="inline-flex items-center rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
    >
      {label}
    </Link>
  );
}
