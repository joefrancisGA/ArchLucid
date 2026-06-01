import Link from "next/link";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { buildGithubBlobHref } from "@/lib/docs-public-base";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicSourceFooterProps = {
  entry: ProductDocumentationEntry;
};

/** Optional GitHub source link for full-operator / developer help contexts only (TB-148). */
export function HelpTopicSourceFooter(props: HelpTopicSourceFooterProps): React.ReactElement | null {
  const { entry } = props;

  if (isBuyerPolishedOperatorShellEnv() && entry.audience !== "developer") {
    return null;
  }

  const primarySource = entry.sourcePaths[0];

  if (primarySource === undefined || primarySource.trim().length === 0) {
    return null;
  }

  return (
    <footer className="mt-10 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <p className={`m-0 ${OPERATOR_TYPOGRAPHY.meta}`}>
        <Link
          href={buildGithubBlobHref(primarySource)}
          className={`underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          View source documentation on GitHub
        </Link>
        <span className="text-neutral-500 dark:text-neutral-400"> — engineering contributors only.</span>
      </p>
    </footer>
  );
}
