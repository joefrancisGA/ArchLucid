import { ExternalLink } from "@/components/ui/external-link";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildGithubBlobHref } from "@/lib/docs-public-base";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

type HelpTopicSourceFooterProps = {
  entry: ProductDocumentationEntry;
};

/** Optional GitHub source link for internal operator shells only (TB-148). */
export function HelpTopicSourceFooter(props: HelpTopicSourceFooterProps): React.ReactElement | null {
  const { entry } = props;

  if (!isArchLucidInternalOperatorShellEnv()) {
    return null;
  }

  const primarySource = entry.sourcePaths[0];

  if (primarySource === undefined || primarySource.trim().length === 0) {
    return null;
  }

  return (
    <footer className="mt-10 border-t border-neutral-200 pt-4 dark:border-neutral-800">
      <p className={`m-0 ${OPERATOR_TYPOGRAPHY.meta}`}>
        <ExternalLink
          href={buildGithubBlobHref(primarySource)}
          className={`underline-offset-2 hover:underline ${DESIGN_TOKENS.accent.link}`}
        >
          View source documentation on GitHub
        </ExternalLink>
        <span className="text-neutral-500 dark:text-neutral-400"> — engineering contributors only.</span>
      </p>
    </footer>
  );
}
