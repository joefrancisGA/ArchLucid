"use client";

import Link from "next/link";

import {
  SupportBundleDownloadButton,
  SupportBundleDownloadButtonMeta,
  useSupportBundleDownloadModel,
} from "@/components/SupportBundleDownloadButton";
import { OperatorReportProblemAction } from "@/components/support/OperatorReportProblemAction";
import { Button } from "@/components/ui/button";
import {
  CONTACT_SUPPORT_PRIMARY_ACTIONS,
  CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE,
} from "@/lib/contact-support-help-guide-content";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { isReportProblemEnabledForSurface } from "@/lib/report-problem-surfaces";
import { TROUBLESHOOTING_SUPPORT_EXPECTATIONS } from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";

/** Registry surface id: contact-support-help-orientation */
const CONTACT_SUPPORT_HELP_ORIENTATION_SURFACE_ID = "contact-support-help-orientation";

/** Primary support actions for `/help/contact-support`. */
export function ContactSupportHelpOrientationStack(): React.JSX.Element {
  const bundleModel = useSupportBundleDownloadModel();
  const reportProblemEnabled = isReportProblemEnabledForSurface(CONTACT_SUPPORT_HELP_ORIENTATION_SURFACE_ID);

  return (
    <div className="space-y-3" data-testid="contact-support-help-orientation-stack">
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="contact-support-help-support-expectations"
      >
        {TROUBLESHOOTING_SUPPORT_EXPECTATIONS}
      </p>

      <div
        className="flex flex-wrap items-center gap-2"
        data-testid="contact-support-help-orientation-actions"
      >
        <OperatorReportProblemAction
          enabled={reportProblemEnabled}
          routePath="/help/contact-support"
          triggerVariant="primary"
        />
        <SupportBundleDownloadButton
          buttonOnly
          model={bundleModel}
          size="sm"
          variant="outline"
        />
        <Button asChild size="sm" variant="outline" data-testid={CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.testId}>
          <a href={CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.href}>
            {CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label}
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" data-testid={CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.testId}>
          <Link href={CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.href}>
            {CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.label}
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          data-testid={CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE.testId}
        >
          <Link href={CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE.href}>
            {CONTACT_SUPPORT_REPORT_PROBLEM_ARTICLE.label}
          </Link>
        </Button>
      </div>

      <SupportBundleDownloadButtonMeta model={bundleModel} showContentsDisclosure />
    </div>
  );
}
