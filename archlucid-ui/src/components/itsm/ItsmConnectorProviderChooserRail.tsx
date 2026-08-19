"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildItsmConnectorProviderChooser,
  resolveItsmConnectorProviderPeerLinks,
  type ItsmConnectorProviderChooserModel,
  type ItsmConnectorProviderId,
} from "@/lib/itsm/itsm-connector-provider-chooser";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ItsmConnectorProviderChooserRailProps = {
  /** Connector page hosting the strip — marks the current product and links peers. */
  readonly currentProviderId: ItsmConnectorProviderId;
  /** Compact one-line strip (default) vs fuller why-three explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildItsmConnectorProviderChooser}. */
  readonly model?: ItsmConnectorProviderChooserModel;
};

/**
 * TB-2256 — Compact chooser rail between Jira, ServiceNow, and Azure Boards connectors.
 * Distinct from TB-2236 finding-job triad. Mount after each integration page header.
 */
export function ItsmConnectorProviderChooserRail(
  props: ItsmConnectorProviderChooserRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildItsmConnectorProviderChooser();
  const peers = resolveItsmConnectorProviderPeerLinks(props.currentProviderId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="itsm-connector-provider-chooser"
        data-variant="compact"
        data-current-provider={props.currentProviderId}
      >
        <span>{model.compactLine}</span>{" "}
        {peers.map((peer, index) => (
          <span key={peer.id}>
            {index > 0 ? " · " : null}
            <Link
              href={peer.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid={`itsm-connector-provider-chooser-peer-${peer.id}`}
            >
              {peer.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="itsm-connector-provider-chooser-heading"
      data-testid="itsm-connector-provider-chooser"
      data-variant="full"
      data-current-provider={props.currentProviderId}
    >
      <h2
        id="itsm-connector-provider-chooser-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {model.providers.map((provider) => {
          const isCurrent = provider.id === props.currentProviderId;

          if (isCurrent) {
            return (
              <li key={provider.id} data-testid="itsm-connector-provider-chooser-current">
                <span className="font-medium text-al-text-primary" aria-current="page">
                  {provider.label}
                </span>
                {" — "}
                <span className="text-al-text-secondary">{provider.whenToUse}</span>
              </li>
            );
          }

          return (
            <li key={provider.id}>
              <Link
                href={provider.href}
                className={cn(OPERATOR_LINK.inline, "font-medium")}
                data-testid={`itsm-connector-provider-chooser-peer-${provider.id}`}
              >
                {provider.label}
              </Link>
              {" — "}
              <span className="text-al-text-secondary">{provider.whenToUse}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
