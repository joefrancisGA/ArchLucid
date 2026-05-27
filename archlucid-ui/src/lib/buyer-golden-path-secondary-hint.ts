/**
 * Short orientation when the user leaves the five-step golden path for supporting detail routes.
 */
export function buyerGoldenPathSecondaryRouteHint(pathname: string): string | null {
  const path = pathname.trim();

  if (path.includes("/findings/")) {
    return "Viewing supporting detail — finding evidence for this review package.";
  }

  if (path === "/ask" || path.startsWith("/ask?")) {
    return "Viewing supporting detail — evidence-backed questions for this review package.";
  }

  if (path.includes("/inspect")) {
    return "Viewing technical evidence trail — return to the finding summary when finished.";
  }

  return null;
}
