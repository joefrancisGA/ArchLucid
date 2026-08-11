"use client";

import { useEffect, useState } from "react";

import type { HelpArticleResponse } from "@/app/api/help/[slug]/route";
import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { HelpApiContractsGuideView } from "@/app/(operator)/help/_sections/HelpApiContractsGuideView";
import { HelpConfigurationReferenceGuideView } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceGuideView";
import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";
import { HelpTopicNotFoundView } from "@/app/(operator)/help/_sections/HelpTopicNotFoundView";
import { ensureAccessTokenFresh, getAccessTokenForApi } from "@/lib/oidc/session";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { OperatorShellAccessGateLoading } from "@/components/OperatorShellAccessGateLoading";

export type HelpTopicMarkdownClientProps = {
  readonly entry: ProductDocumentationEntry;
};

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; markdown: string };

export function HelpTopicMarkdownClient(props: HelpTopicMarkdownClientProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadMarkdown(): Promise<void> {
      try {
        await ensureAccessTokenFresh();
        const headers = new Headers({ Accept: "application/json" });
        const bearer = getAccessTokenForApi();

        if (bearer !== undefined && bearer !== null && bearer.trim().length > 0) {
          headers.set("Authorization", `Bearer ${bearer}`);
        }

        const response = await fetch(`/api/help/${encodeURIComponent(props.entry.slug)}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers,
        });

        if (!response.ok) {
          if (!cancelled) {
            setState({ status: "error" });
          }

          return;
        }

        const article = (await response.json()) as HelpArticleResponse;

        if (!cancelled) {
          setState({ status: "loaded", markdown: article.markdown });
        }
      } catch {
        if (!cancelled) {
          setState({ status: "error" });
        }
      }
    }

    void loadMarkdown();

    return () => {
      cancelled = true;
    };
  }, [props.entry.slug]);

  if (state.status === "loading") {
    return <OperatorShellAccessGateLoading />;
  }

  if (state.status === "error") {
    return <HelpTopicNotFoundView />;
  }

  if (props.entry.slug === "developer-troubleshooting") {
    return <HelpEngineeringTroubleshootingGuideView entry={props.entry} markdown={state.markdown} />;
  }

  if (props.entry.slug === "configuration-reference") {
    return <HelpConfigurationReferenceGuideView entry={props.entry} markdown={state.markdown} />;
  }

  if (props.entry.slug === "api-contracts") {
    return <HelpApiContractsGuideView entry={props.entry} markdown={state.markdown} />;
  }

  return (
    <HelpTopicMarkdownView
      entry={props.entry}
      markdown={state.markdown}
      showContextualHelp
    />
  );
}
