/** Mirrors `ExecDigestSponsorDeepLinkOperatorLinks` for UI tests (TB-2196). */
export const ExecDigestSponsorDeepLinkOperatorLinks = {
  buildDashboardUrl(operatorBaseUrl: string | null | undefined, token: string): string {
    const relativePath = `/digest/sponsor?token=${encodeURIComponent(token)}`;
    if (!operatorBaseUrl?.trim())
      return relativePath;

    return `${operatorBaseUrl.trim().replace(/\/$/, "")}${relativePath}`;
  },

  buildRunCollateralUrl(
    operatorBaseUrl: string | null | undefined,
    runIdHex: string,
    token: string,
  ): string {
    const normalizedRunIdHex = runIdHex.trim().replace(/-/g, "");
    const relativePath =
      `/digest/sponsor/run/${encodeURIComponent(normalizedRunIdHex)}?token=${encodeURIComponent(token)}`;

    if (!operatorBaseUrl?.trim())
      return relativePath;

    return `${operatorBaseUrl.trim().replace(/\/$/, "")}${relativePath}`;
  },
} as const;
