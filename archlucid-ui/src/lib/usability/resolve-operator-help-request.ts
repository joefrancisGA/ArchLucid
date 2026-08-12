import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  pageHelpTopicForPathname,
  pathnameIsInAppHelpTopic,
} from "@/lib/usability/page-help-topic-map";

export type OperatorHelpRequest =
  | { readonly kind: "navigate"; readonly href: string }
  | { readonly kind: "drawer" };

/**
 * Resolves F1 / shell Help: open the job-matched `/help/{slug}` page when the current
 * operator route has one; otherwise fall back to the contextual help drawer.
 */
export function resolveOperatorHelpRequestForPathname(pathname: string): OperatorHelpRequest {
  if (pathnameIsInAppHelpTopic(pathname)) {
    return { kind: "drawer" };
  }

  const topic = pageHelpTopicForPathname(pathname);

  if (topic?.slug != null && topic.slug.length > 0) {
    return {
      kind: "navigate",
      href: inAppHelpHref(topic.slug, topic.hashFragment),
    };
  }

  return { kind: "drawer" };
}
