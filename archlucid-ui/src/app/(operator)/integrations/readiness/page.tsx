import type { Metadata } from "next";
import Link from "next/link";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Integration readiness",
};

export default function IntegrationsReadinessPage() {
  return (
    <div className="w-full max-w-[1120px] space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="Integration readiness"
        subtitle="See which integrations are ready, recommended, or optional for this workspace — and what to configure first."
        actions={<PageContextualHelpButton />}
      />
      <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Integration readiness shows which notification, ticketing, publishing, and delivery integrations are configured
        for this workspace.{" "}
        <Link
          href="/help/integration-readiness"
          className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        >
          How integration readiness works
        </Link>
      </p>
      <ConnectorOperationsDashboard />
    </div>
  );
}
