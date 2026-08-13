import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA,
  BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY,
  BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

type DemoWorkspaceCapabilityUnavailablePanelProps = {
  readonly capability: string;
  readonly description?: string;
  /** Standalone pages center the panel; embedded layouts sit flush inside page chrome. */
  readonly layout?: "standalone" | "embedded";
};

/** Polished empty state when a capability route is reachable but disabled in buyer demo mode. */
export function DemoWorkspaceCapabilityUnavailablePanel(
  props: DemoWorkspaceCapabilityUnavailablePanelProps,
): React.JSX.Element {
  const { capability, description, layout = "standalone" } = props;
  const connectedTenantLead = description ?? BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY;

  return (
    <div
      className={cn("rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body,
        layout === "standalone" ? "mx-auto max-w-2xl" : "w-full",
      )}
      data-testid="demo-workspace-capability-unavailable"
      data-demo-capability={capability}
    >
      <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">{BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE}</p>
      <p className="m-0 mt-2 leading-relaxed">{connectedTenantLead}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild size="sm">
          <Link href="/architecture/reviews">Open reviews</Link>
        </Button>
        <Link href="/help/troubleshooting" className={cn("font-medium text-teal-800 underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>
          {BUYER_DEMO_CAPABILITY_TROUBLESHOOTING_CTA}
        </Link>
      </div>
    </div>
  );
}
