"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseTenantSettingsRoutingScopeOpenFromSearch,
  tenantSettingsRoutingScopeDisclosureHrefFromSearch,
} from "@/lib/administration/tenant-settings-routing-scope-disclosure-url";
import { TENANT_SETTINGS_ORGANIZATION_IDP_NOTE } from "@/lib/tenant-settings-page-copy";
import { PROJECTS_RECYCLE_BIN_PATH } from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";

import { TenantWorkspaceProjectsCard } from "./TenantWorkspaceProjectsCard";
import type { TenantSettingsPageContentModel } from "./tenant-settings-page-view-model";

type Props = {
  readonly tenantDisplayName: string;
  readonly scope: Readonly<Record<string, string>>;
  readonly model: TenantSettingsPageContentModel;
};

export function TenantSettingsOrganizationCards({ tenantDisplayName, scope, model }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/workspace-settings";
  const searchParams = useSearchParams();
  const tenantSettingsRoutingScopeOpenParam = searchParams.get("tenantSettingsRoutingScopeOpen");
  const [routingScopeOpen, setRoutingScopeOpenState] = useState(() =>
    parseTenantSettingsRoutingScopeOpenFromSearch(tenantSettingsRoutingScopeOpenParam),
  );

  const syncRoutingScopeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        tenantSettingsRoutingScopeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRoutingScopeOpen = useCallback(
    (open: boolean) => {
      setRoutingScopeOpenState(open);
      syncRoutingScopeOpenToUrl(open);
    },
    [syncRoutingScopeOpenToUrl],
  );

  useEffect(() => {
    setRoutingScopeOpenState(parseTenantSettingsRoutingScopeOpenFromSearch(tenantSettingsRoutingScopeOpenParam));
  }, [tenantSettingsRoutingScopeOpenParam]);

  return (
    <>
      <Card data-testid="tenant-settings-organization-card">
        <CardHeader>
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>
          <p
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="tenant-settings-tenant-display-name"
          >
            {tenantDisplayName}
          </p>
          <p className="m-0">{TENANT_SETTINGS_ORGANIZATION_IDP_NOTE}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          {/* Named apart from the "Workspace scope" vocabulary-rail link (TB-2317) so the page does not repeat one label for two targets. */}
          <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Active workspace and projects
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            Your active workspace and project are selected from the workspace switcher.
          </p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            Soft-deleted architecture projects move to the projects recycle bin, where you can review or restore them
            before permanent removal.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={PROJECTS_RECYCLE_BIN_PATH} data-testid="tenant-settings-recycle-bin-link">
              Open projects recycle bin
            </Link>
          </Button>

          <CollapsibleSection title="Technical details — routing scope" open={routingScopeOpen} onToggle={setRoutingScopeOpen}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Internal browser-to-API routing carries scope identifiers on proxied requests. Values below reflect your
              current selection.
            </p>
            <ul className={cn("m-0 mt-2 list-inside list-disc", OPERATOR_TYPOGRAPHY.body)}>
              <li>
                Tenant: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-tenant-id"]}</span>
              </li>
              <li>
                Workspace: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-workspace-id"]}</span>
              </li>
              <li>
                Project: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{scope["x-project-id"]}</span>
              </li>
            </ul>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Hosted deployments with more than one API instance should use a shared projection cache —{" "}
              <a
                className={OPERATOR_LINK.inline}
                href={toDocsBlobUrl("/docs/operations/PROJECTION_CACHE_AND_REPLICAS.md")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn more about projection cache and replicas
              </a>
              .
            </p>
          </CollapsibleSection>
        </CardContent>
      </Card>

      <TenantWorkspaceProjectsCard />

      {/* Only render when an active pilot/trial exists; hide the "None" / null state to reduce noise */}
      {model.trial != null && model.trial.status != null && model.trial.status !== "None" ? (
        <Card>
          <CardHeader>
            <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Pilot / trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium">Status:</span> {model.trial.status}
              {typeof model.trial.daysRemaining === "number" ? (
                <span>
                  {" "}
                  — <span className="font-medium">Days remaining:</span> {model.trial.daysRemaining}
                </span>
              ) : null}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
