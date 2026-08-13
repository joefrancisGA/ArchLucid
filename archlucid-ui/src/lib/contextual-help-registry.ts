/**
 * Page-scoped context-sensitive help — re-exported from `@/lib/contextual-help/` so existing
 * imports keep working. New code should import from the registry or a domain row module directly.
 */

export type {
  PageContextualHelpAction,
  PageContextualHelpEntry,
  PageContextualHelpRow,
} from "@/lib/contextual-help/types";
export { allPageContextualHelpRows, contextualHelpForPathname } from "@/lib/contextual-help/registry";
