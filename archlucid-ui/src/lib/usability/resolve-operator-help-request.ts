import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  pageHelpTopicForPathname,
  pathnameIsInAppHelpTopic,
} from "@/lib/usability/page-help-topic-map";

export type OperatorHelpRequest =
  | { readonly kind: "navigate"; readonly href: string }
  | { readonly kind: "drawer" };

export type ResolveOperatorHelpRequestOptions = {
  readonly workingMode?: boolean;
};

/**
 * Resolves F1 / shell Help: open the job-matched `/help/{slug}` page when the current
 * operator route has one; otherwise fall back to the contextual help drawer.
 */
export function resolveOperatorHelpRequestForPathname(
  pathname: string,
  options?: ResolveOperatorHelpRequestOptions,
): OperatorHelpRequest {
  if (pathnameIsInAppHelpTopic(pathname)) {
    return { kind: "drawer" };
  }

  const topic = pageHelpTopicForPathname(pathname);
  const workingMode = options?.workingMode === true;

  if (topic?.slug != null && topic.slug.length > 0) {
    const normalizedPath = (pathname ?? "").split("?")[0]?.trim() || "/";

    if (workingMode && normalizedPath === "/" && topic.slug === "first-architecture-review") {
      return {
        kind: "navigate",
        href: inAppHelpHref("getting-started"),
      };
    }

    return {
      kind: "navigate",
      href: inAppHelpHref(topic.slug, topic.hashFragment),
    };
  }

  return { kind: "drawer" };
}
