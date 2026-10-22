/** Result of the overview primary CTA when it activates or scrolls to the submit workflow. */
export type FocusSubmitSectionResult =
  | { readonly kind: "scrolled-to-submit" }
  | { readonly kind: "activated-review"; readonly runId: string }
  | { readonly kind: "blocked-empty-review" };
