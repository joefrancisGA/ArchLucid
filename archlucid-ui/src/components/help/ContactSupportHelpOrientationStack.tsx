import Link from "next/link";

import { SupportBundleDownloadButton } from "@/components/SupportBundleDownloadButton";
import { Button } from "@/components/ui/button";
import { CONTACT_SUPPORT_PRIMARY_ACTIONS } from "@/lib/contact-support-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";
import { ARCHLUCID_SUPPORT_EMAIL } from "@/lib/support-workspace-present";
import { cn } from "@/lib/utils";

/** Primary support actions for `/help/contact-support`. */
export function ContactSupportHelpOrientationStack(): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="contact-support-help-orientation-stack">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="primary">
          <Link href={CONTACT_SUPPORT_PRIMARY_ACTIONS.reportProblem.href}>
            {CONTACT_SUPPORT_PRIMARY_ACTIONS.reportProblem.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.href}>
            {CONTACT_SUPPORT_PRIMARY_ACTIONS.emailSupport.label}
          </a>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.href}>
            {CONTACT_SUPPORT_PRIMARY_ACTIONS.troubleshooting.label}
          </Link>
        </Button>
      </div>

      <SupportBundleDownloadButton showContentsDisclosure showDiagnosticsLink />

      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="contact-support-help-support-email"
      >
        Support email:{" "}
        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={`mailto:${ARCHLUCID_SUPPORT_EMAIL}`}>
          {ARCHLUCID_SUPPORT_EMAIL}
        </Link>
      </p>

      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Workspace administrators can open{" "}
        <Link className={OPERATOR_LINK.nav} href={SETTINGS_SUPPORT_PATH}>
          Administration → Support
        </Link>{" "}
        for bundle templates and guided troubleshooting shortcuts.
      </p>
    </div>
  );
}
