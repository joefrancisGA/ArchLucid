import type { PageContextualHelpAction } from "@/lib/contextual-help/types";

export type PageHelpDrawerSupplement = {
  readonly detail?: string;
  readonly keyPoints?: readonly string[];
  readonly relatedLinks?: readonly PageContextualHelpAction[];
};
