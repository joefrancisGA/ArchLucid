/**
 * Benign console / network noise for founder page guards (GTM M-104).
 * Prefer fixing product noise over growing this list.
 */

export type FounderNoiseAllowlistEntry = {
  readonly pattern: RegExp;
  readonly reason: string;
};

/** pageerror + console error text allowlist */
export const FOUNDER_CONSOLE_NOISE_ALLOWLIST: readonly FounderNoiseAllowlistEntry[] = [
  {
    pattern: /ResizeObserver loop/i,
    reason: "Browser ResizeObserver loop limit — common false positive",
  },
  {
    pattern: /Loading chunk [\w.-]+ failed/i,
    reason: "Transient chunk load during navigation / deploy swap",
  },
  {
    pattern: /hydrat/i,
    reason: "Known Next hydration mismatch noise during RSC transitions (track separately)",
  },
  {
    pattern: /Download the React DevTools/i,
    reason: "React DevTools suggestion",
  },
  {
    pattern: /status of 429 \(Too Many Requests\)/i,
    reason: "Mock/acceptance parallel founder walk can trip shared rate limits",
  },
];

/** Failed request URL or failure text allowlist */
export const FOUNDER_NETWORK_NOISE_ALLOWLIST: readonly FounderNoiseAllowlistEntry[] = [
  {
    pattern: /favicon\.ico/i,
    reason: "Missing favicon is not a buyer defect for this gate",
  },
  {
    pattern: /net::ERR_ABORTED/i,
    reason: "Aborted by navigation — expected when leaving a page mid-flight",
  },
  {
    pattern: /net::ERR_FAILED/i,
    reason: "Often accompanies intentional abort / route change",
  },
  {
    pattern: /chrome-extension:\/\//i,
    reason: "Local browser extensions",
  },
  {
    pattern: /\/_next\/webpack-hmr/i,
    reason: "Dev HMR websocket",
  },
  {
    pattern: /\/_next\/static\/chunks\//i,
    reason: "Chunk cancel on navigation",
  },
  {
    pattern: /\b429\b|Too Many Requests/i,
    reason: "Mock/acceptance parallel founder walk can trip shared rate limits",
  },
];

export function matchesFounderNoiseAllowlist(
  text: string,
  entries: readonly FounderNoiseAllowlistEntry[],
): boolean {
  return entries.some((entry) => entry.pattern.test(text));
}
