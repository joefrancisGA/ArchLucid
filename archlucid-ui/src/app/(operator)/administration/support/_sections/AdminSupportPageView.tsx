"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useState } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ReportProblemSupportWorkspaceVocabularyRail } from "@/components/ReportProblemSupportWorkspaceVocabularyRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  ARCHLUCID_SUPPORT_EMAIL,
  SUPPORT_BUNDLE_EXCLUDED_ITEMS,
  SUPPORT_BUNDLE_INCLUDED_ITEMS,
  SUPPORT_BUNDLE_SAFETY_SUMMARY,
  SUPPORT_CONTACT_WORKFLOW,
  SUPPORT_EMAIL_FALLBACK_SUMMARY,
  SUPPORT_PAGE_GUIDANCE,
  SUPPORT_REPORT_PROBLEM_HELP_HREF,
  SUPPORT_REPORT_PROBLEM_SUMMARY,
  SUPPORT_REQUEST_CHECKLIST,
  SUPPORT_TROUBLESHOOTING_SHORTCUTS,
  buildSupportRequestTemplate,
  resolveSupportBundleStatusLabel,
  resolveSupportTroubleshootingHref,
} from "@/lib/support-workspace-present";
import { REPORT_PROBLEM_HELP_SLA_SENTENCE } from "@/lib/report-problem-help-copy-guard";

import { AdminSupportBreadcrumb } from "./AdminSupportBreadcrumb";
import { AdminSupportBuyerChrome } from "./AdminSupportBuyerChrome";
import {
  ADMIN_SUPPORT_PAGE_TITLE,
  ADMIN_SUPPORT_PRIMARY_CONTENT_ID,
  ADMIN_SUPPORT_SKIP_LINK_LABEL,
  adminSupportPageSubtitle,
} from "./admin-support-page-copy";
import type { UseAdminSupportPageModel } from "./use-admin-support-page";

type AdminSupportPageViewProps = {
  readonly model: UseAdminSupportPageModel;
};

async function copyText(value: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export function AdminSupportPageView({ model }: AdminSupportPageViewProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const copySupportEmail = useCallback(async () => {
    await copyText(ARCHLUCID_SUPPORT_EMAIL);
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const copySupportTemplate = useCallback(async () => {
    await copyText(buildSupportRequestTemplate(model.workspaceLabel));
    setCopiedTemplate(true);
    window.setTimeout(() => setCopiedTemplate(false), 2000);
  }, [model.workspaceLabel]);

  if (model.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Support tools"
        description="In a connected tenant, architects download redacted support bundles and attach them to tickets."
      />
    );
  }

  const troubleshootingShortcuts = SUPPORT_TROUBLESHOOTING_SHORTCUTS.filter(
    (shortcut) => !shortcut.internalOnly || model.showInternalDiagnostics,
  );

  const bundleStatusLabel =
    model.bundleStatus === "ready" && model.lastGeneratedAt !== null
      ? `Download ready — last generated ${formatRelativeTime(model.lastGeneratedAt.toISOString())}`
      : resolveSupportBundleStatusLabel(model.bundleStatus, model.lastGeneratedAt);

  const downloadDisabled = model.downloading || !model.canGenerateBundle;

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-support-page">
      <a
        href={`#${ADMIN_SUPPORT_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ADMIN_SUPPORT_SKIP_LINK_LABEL}
      </a>
      <div
        id={ADMIN_SUPPORT_PRIMARY_CONTENT_ID}
        data-testid="admin-support-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={SETTINGS_SUPPORT_PATH}
          title={ADMIN_SUPPORT_PAGE_TITLE}
          titleTestId="admin-support-title"
          breadcrumb={buyerPolishedShell ? <AdminSupportBreadcrumb /> : undefined}
          subtitle={adminSupportPageSubtitle(buyerPolishedShell)}
        />

        <AdminSupportBuyerChrome />

        {buyerPolishedShell ? null : (
          <ReportProblemSupportWorkspaceVocabularyRail currentSurfaceId="support-workspace" />
        )}

        {buyerPolishedShell ? null : (
          <p
            className={cn(
              "m-0 rounded-lg border border-neutral-200 bg-neutral-50/70 px-4 py-3 text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/40",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="admin-support-guidance"
          >
            {SUPPORT_PAGE_GUIDANCE}
          </p>
        )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={OPERATOR_LAYOUT.sectionStack}>
          <SupportSection title="Report a problem" testId="admin-support-report-problem">
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{SUPPORT_REPORT_PROBLEM_SUMMARY}</p>
            <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {REPORT_PROBLEM_HELP_SLA_SENTENCE}
            </p>
            <div className="mt-4">
              <Link href={SUPPORT_REPORT_PROBLEM_HELP_HREF} className={cn("font-medium", OPERATOR_LINK.nav)}>
                Read the Report problem help topic
              </Link>
            </div>
          </SupportSection>

          <SupportSection title="Contact support" testId="admin-support-contact">
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{SUPPORT_CONTACT_WORKFLOW}</p>
            <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {SUPPORT_EMAIL_FALLBACK_SUMMARY}
            </p>

            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/60 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Support email</p>
              <a className={cn("mt-1 inline-block font-medium", OPERATOR_LINK.nav)} href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>
                {ARCHLUCID_SUPPORT_EMAIL}
              </a>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copySupportEmail()}>
                {copiedEmail ? "Email copied" : "Copy support email"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void copySupportTemplate()}>
                {copiedTemplate ? "Template copied" : "Copy support template"}
              </Button>
            </div>

            <div className="mt-4">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>What to include</p>
              <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
                {SUPPORT_REQUEST_CHECKLIST.map((item) => (
                  <li key={item} className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </SupportSection>

          <SupportSection title="Common next steps" testId="admin-support-troubleshooting">
            <ul className="m-0 list-none space-y-3 p-0">
              {troubleshootingShortcuts.map((shortcut) => (
                <li
                  key={shortcut.id}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950"
                  data-testid={`admin-support-shortcut-${shortcut.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={resolveSupportTroubleshootingHref(shortcut.route)}
                      className={cn("font-medium", OPERATOR_LINK.nav)}
                    >
                      {shortcut.title}
                    </Link>
                    {shortcut.internalOnly ? (
                      <Badge variant="outline" className="border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">
                        Internal
                      </Badge>
                    ) : null}
                  </div>
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{shortcut.detail}</p>
                </li>
              ))}
            </ul>
          </SupportSection>
        </div>

        <SupportSection title="Support bundle" testId="admin-support-bundle">
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Advanced: download a redacted diagnostics bundle when ArchLucid support requests it, or when attaching
            manually to email. Report problem can optionally attach a bundle in one step.
          </p>

          <p
            className={cn(
              "m-0 mt-3",
              DESIGN_TOKENS.callout.success,
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="admin-support-bundle-safety"
          >
            {SUPPORT_BUNDLE_SAFETY_SUMMARY}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <BundleDataList title="Included" items={SUPPORT_BUNDLE_INCLUDED_ITEMS} testId="admin-support-bundle-included" />
            <BundleDataList title="Not included" items={SUPPORT_BUNDLE_EXCLUDED_ITEMS} testId="admin-support-bundle-excluded" />
          </div>

          <div className="mt-4 space-y-3">
            <Button
              type="button"
              data-testid="admin-support-download-bundle"
              disabled={downloadDisabled}
              onClick={() => void model.onDownload()}
            >
              {model.downloading ? "Preparing bundle…" : "Download support bundle"}
            </Button>

            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="admin-support-bundle-status"
            >
              {bundleStatusLabel}
            </p>

            {!model.canGenerateBundle ? (
              <p
                className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}
                role="status"
                data-testid="admin-support-bundle-permission"
              >
                Execute authority or higher is required to generate a support bundle.
              </p>
            ) : null}

            {model.error !== null ? (
              <p
                role="alert"
                className={cn(
                  "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                data-testid="admin-support-download-error"
              >
                {model.error}
              </p>
            ) : null}
          </div>
        </SupportSection>
      </div>
      </div>
    </OperatorPageContainer>
  );
}

type SupportSectionProps = {
  readonly title: string;
  readonly testId: string;
  readonly children: React.ReactNode;
};

function SupportSection({ title, testId, children }: SupportSectionProps) {
  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={testId}
    >
      <h2 className={cn("m-0 mb-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>{title}</h2>
      {children}
    </section>
  );
}

type BundleDataListProps = {
  readonly title: string;
  readonly items: readonly string[];
  readonly testId: string;
};

function BundleDataList({ title, items, testId }: BundleDataListProps) {
  return (
    <div data-testid={testId}>
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</p>
      <ul className="m-0 mt-2 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item} className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
