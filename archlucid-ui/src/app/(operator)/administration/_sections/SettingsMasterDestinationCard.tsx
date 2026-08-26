"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SettingsScopeMeta } from "./SettingsScopeMeta";
import type { SettingsMasterDestination } from "./settings-master-types";

type SettingsMasterDestinationCardProps = {
  readonly destination: SettingsMasterDestination;
};

export function SettingsMasterDestinationCard(props: SettingsMasterDestinationCardProps) {
  const destination = props.destination;

  return (
    <Card data-testid={`settings-destination-${destination.id}`}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{destination.title}</CardTitle>
          {destination.highImpact === true ? (
            <span
              className={cn(
                "rounded-md border border-amber-600/40 bg-amber-50 px-2 py-0.5 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
            >
              High impact
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0 text-al-text-secondary">{destination.description}</p>
        {destination.emptyStateHint ? (
          <p className={cn("m-0 italic text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {destination.emptyStateHint}
          </p>
        ) : null}
        <details className="group" data-testid="settings-destination-meta-disclosure">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-2 text-al-text-secondary underline-offset-2 hover:underline marker:content-none [&::-webkit-details-marker]:hidden",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <DisclosureTriangleIndicator />
            Scope and editability details
          </summary>
          <div className="mt-2">
            <SettingsScopeMeta
              scope={destination.scope}
              source={destination.source}
              editability={destination.editability}
              saveBehavior={destination.saveBehavior}
            />
          </div>
        </details>
        {destination.highImpact === true ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Changes require confirmation on the destination page and are recorded in the audit trail.
          </p>
        ) : null}
        <Button asChild variant="outline" size="sm">
          <Link href={destination.href}>{destination.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
