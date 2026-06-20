import Link from "next/link";

import {
  BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY,
  buyerDemoCapabilityUnavailableTitle,
} from "@/lib/buyer-polish-copy";

type DemoWorkspaceCapabilityUnavailablePanelProps = {
  readonly capability: string;
  readonly description?: string;
};

/** Polished empty state when a capability route is reachable but disabled in buyer demo mode. */
export function DemoWorkspaceCapabilityUnavailablePanel(
  props: DemoWorkspaceCapabilityUnavailablePanelProps,
): React.JSX.Element {
  const { capability, description } = props;

  return (
    <div
      className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
      data-testid="demo-workspace-capability-unavailable"
    >
      <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">
        {buyerDemoCapabilityUnavailableTitle(capability)}
      </p>
      <p className="m-0 mt-2 leading-relaxed">{description ?? BUYER_DEMO_CAPABILITY_UNAVAILABLE_BODY}</p>
      <p className="m-0 mt-4">
        <Link href="/" className="font-medium text-teal-800 underline dark:text-teal-300">
          Return to home
        </Link>
      </p>
    </div>
  );
}
