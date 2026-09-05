"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { InAppHelpLink } from "@/components/InAppHelpLink";

import {
  API_KEYS_TECHNICAL_DETAILS_TITLE,
} from "@/lib/api-keys-settings-copy";
import {
  apiKeysTechnicalDetailsHrefFromSearch,
  parseApiKeysTechnicalDetailsOpenFromSearch,
} from "@/lib/administration/api-keys-technical-details-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { components } from "@/lib/api-types.generated";

type AdminApiKeySettingsResponse = components["schemas"]["AdminApiKeySettingsResponse"];
type AdminApiKeyRotateResponse = components["schemas"]["AdminApiKeyRotateResponse"];

export type ApiKeysSettingsTechnicalDetailsProps = {
  readonly settings: AdminApiKeySettingsResponse;
  readonly rotateResponse: AdminApiKeyRotateResponse | null;
};

export function ApiKeysSettingsTechnicalDetails(props: ApiKeysSettingsTechnicalDetailsProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/api-keys";
  const searchParams = useSearchParams();
  const apiKeysTechnicalDetailsOpenParam = searchParams.get("apiKeysTechnicalDetailsOpen");
  const [open, setOpenState] = useState(() =>
    parseApiKeysTechnicalDetailsOpenFromSearch(apiKeysTechnicalDetailsOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(apiKeysTechnicalDetailsHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseApiKeysTechnicalDetailsOpenFromSearch(apiKeysTechnicalDetailsOpenParam));
  }, [apiKeysTechnicalDetailsOpenParam]);

  return (
    <details
      className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700"
      data-testid="api-keys-technical-details"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {API_KEYS_TECHNICAL_DETAILS_TITLE}
      </summary>
      <div className={cn("mt-3 space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        <p className="m-0">
          Live deployment values for this workspace. For configuration key names and hosting options, see{" "}
          <InAppHelpLink helpSlug="configuration-reference" label="Configuration reference" variant="text" />.
        </p>
        <dl className="m-0 grid grid-cols-[minmax(0,220px)_1fr] gap-2">
          <dt>Authentication:ApiKey:Enabled</dt>
          <dd className="font-mono text-al-text-primary">{String(props.settings.enabled)}</dd>
          <dt>DevelopmentBypassAll</dt>
          <dd className="font-mono text-al-text-primary">{String(props.settings.developmentBypassAll)}</dd>
        </dl>
        {props.rotateResponse?.configPath ? (
          <p className="m-0">
            Last rotation config path:{" "}
            <span className="font-mono text-al-text-primary">{props.rotateResponse.configPath}</span>
          </p>
        ) : null}
        {props.rotateResponse?.deploymentAction === "Replace" && props.rotateResponse.replaceConfigValue ? (
          <label className="block space-y-1">
            <span>Replace config value</span>
            <textarea
              className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900"
              readOnly
              rows={2}
              value={props.rotateResponse.replaceConfigValue}
            />
          </label>
        ) : null}
        {props.rotateResponse?.deploymentAction !== "Replace" && props.rotateResponse?.appendConfigSuffix ? (
          <label className="block space-y-1">
            <span>Append config suffix</span>
            <textarea
              className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900"
              readOnly
              rows={1}
              value={props.rotateResponse.appendConfigSuffix}
            />
          </label>
        ) : null}
      </div>
    </details>
  );
}
