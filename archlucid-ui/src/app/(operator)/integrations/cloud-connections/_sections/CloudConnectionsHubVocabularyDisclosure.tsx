"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  buildConnectionStatusCloudConnectionsVocabulary,
  resolveConnectionStatusCloudConnectionsPeerLink,
} from "@/lib/vocabulary/connection-status-cloud-connections-vocabulary";
import {
  buildExtractUploadCloudConnectionsVocabulary,
  resolveExtractUploadCloudConnectionsPeerLink,
} from "@/lib/vocabulary/extract-upload-cloud-connections-vocabulary";
import { CLOUD_CONNECTIONS_HUB_VOCABULARY_DISCLOSURE_TITLE } from "@/lib/cloud-connections-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  cloudConnectionsHubVocabularyDisclosureHrefFromSearch,
  parseCloudConnectionsHubVocabularyOpenFromSearch,
} from "@/lib/integrations/cloud-connections-hub-vocabulary-disclosure-url";
import { cn } from "@/lib/utils";

/** Collapsed orientation for Connection status and Extract & Upload naming. */
export function CloudConnectionsHubVocabularyDisclosure(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/cloud-connections";
  const searchParams = useSearchParams();
  const cloudConnectionsHubVocabularyOpenParam = searchParams.get("cloudConnectionsHubVocabularyOpen");
  const connectionStatusModel = buildConnectionStatusCloudConnectionsVocabulary();
  const extractUploadModel = buildExtractUploadCloudConnectionsVocabulary();
  const connectionStatusPeer = resolveConnectionStatusCloudConnectionsPeerLink("cloud-connections");
  const extractUploadPeer = resolveExtractUploadCloudConnectionsPeerLink("cloud-connections");
  const [open, setOpenState] = useState(() =>
    parseCloudConnectionsHubVocabularyOpenFromSearch(cloudConnectionsHubVocabularyOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        cloudConnectionsHubVocabularyDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
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
    setOpenState(parseCloudConnectionsHubVocabularyOpenFromSearch(cloudConnectionsHubVocabularyOpenParam));
  }, [cloudConnectionsHubVocabularyOpenParam]);

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="cloud-connections-hub-vocabulary-disclosure"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {CLOUD_CONNECTIONS_HUB_VOCABULARY_DISCLOSURE_TITLE}
      </summary>
      <div className="mt-2 space-y-3 text-al-text-secondary">
        <p className="m-0">
          <span className="font-medium text-al-text-primary">Connection status:</span>{" "}
          {connectionStatusModel.whyTwo}{" "}
          <Link
            href={connectionStatusPeer.href}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid="cloud-connections-hub-vocabulary-connection-status-link"
          >
            {connectionStatusPeer.label}
          </Link>
        </p>
        <p className="m-0">
          <span className="font-medium text-al-text-primary">Extract & Upload:</span>{" "}
          {extractUploadModel.whyTwo}{" "}
          <Link
            href={extractUploadPeer.href}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid="cloud-connections-hub-vocabulary-extract-upload-link"
          >
            {extractUploadPeer.label}
          </Link>
        </p>
      </div>
    </details>
  );
}
