"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityTag } from "@/components/ui/severity-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseSettingsDestinationMetaDestinationIdFromSearch,
  settingsDestinationMetaDisclosureHrefFromSearch,
} from "@/lib/administration/settings-destination-meta-disclosure-url";
import { cn } from "@/lib/utils";

import { SettingsScopeMeta } from "./SettingsScopeMeta";
import type { SettingsMasterDestination } from "./settings-master-types";

type SettingsMasterDestinationCardProps = {
  readonly destination: SettingsMasterDestination;
  readonly hideTitle?: boolean;
};

export function SettingsMasterDestinationCard(props: SettingsMasterDestinationCardProps) {
  const destination = props.destination;
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/settings";
  const searchParams = useSearchParams();
  const settingsDestinationMetaDestinationIdParam = searchParams.get("settingsDestinationMetaDestinationId");
  const [metaOpen, setMetaOpenState] = useState(
    () =>
      parseSettingsDestinationMetaDestinationIdFromSearch(settingsDestinationMetaDestinationIdParam) === destination.id,
  );

  const syncMetaOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        settingsDestinationMetaDisclosureHrefFromSearch(
          searchParams.toString(),
          open ? destination.id : null,
          pathname,
        ),
        { scroll: false },
      );
    },
    [destination.id, pathname, router, searchParams],
  );

  const setMetaOpen = useCallback(
    (open: boolean) => {
      setMetaOpenState(open);
      syncMetaOpenToUrl(open);
    },
    [syncMetaOpenToUrl],
  );

  useEffect(() => {
    setMetaOpenState(
      parseSettingsDestinationMetaDestinationIdFromSearch(settingsDestinationMetaDestinationIdParam) === destination.id,
    );
  }, [destination.id, settingsDestinationMetaDestinationIdParam]);

  const showAuditConfirmation =
    destination.editability !== "read-only"
    && (destination.highImpact === true || Boolean(destination.saveBehavior));

  return (
    <Card className="flex h-full flex-col" data-testid={`settings-destination-${destination.id}`}>
      {props.hideTitle !== true ? (
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{destination.title}</CardTitle>
            {destination.highImpact === true ? (
              <SeverityTag kind="high" label="High impact" />
            ) : null}
          </div>
        </CardHeader>
      ) : (
        <CardHeader className="space-y-2 pb-0">
          {destination.highImpact === true ? (
            <div className="flex justify-end">
              <SeverityTag kind="high" label="High impact" />
            </div>
          ) : null}
        </CardHeader>
      )}
      <CardContent className={cn("flex flex-1 flex-col space-y-3", OPERATOR_TYPOGRAPHY.body)}>
        <div className="space-y-3">
          <p className="m-0 text-al-text-secondary">{destination.description}</p>
          {destination.emptyStateHint ? (
            <p className={cn("m-0 italic text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {destination.emptyStateHint}
            </p>
          ) : null}
        </div>
        <div className="mt-auto space-y-3">
          <details
            className="group"
            data-testid="settings-destination-meta-disclosure"
            open={metaOpen}
            onToggle={(event) => {
              setMetaOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
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
          {showAuditConfirmation ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Changes require confirmation on the destination page and are recorded in the audit trail.
            </p>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={destination.href}>{destination.cta}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
