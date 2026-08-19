import type { Page, Request, Response } from "@playwright/test";

import {
  FOUNDER_CONSOLE_NOISE_ALLOWLIST,
  FOUNDER_NETWORK_NOISE_ALLOWLIST,
  matchesFounderNoiseAllowlist,
} from "./founder-page-noise-allowlist";

export type FounderPageGuardCapture = {
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
  readonly failedRequests: string[];
  readonly serverErrors: string[];
};

/**
 * Attach pageerror / console.error / requestfailed / HTTP 5xx listeners (GTM M-104).
 * Call {@link assertFounderPageGuardsClean} after navigating founder routes.
 */
export function attachFounderPageGuards(page: Page): FounderPageGuardCapture {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const serverErrors: string[] = [];

  page.on("pageerror", (error: Error) => {
    const message = error.message ?? String(error);

    if (matchesFounderNoiseAllowlist(message, FOUNDER_CONSOLE_NOISE_ALLOWLIST)) {
      return;
    }

    pageErrors.push(message);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") {
      return;
    }

    const text = msg.text();

    if (matchesFounderNoiseAllowlist(text, FOUNDER_CONSOLE_NOISE_ALLOWLIST)) {
      return;
    }

    consoleErrors.push(text);
  });

  page.on("requestfailed", (request: Request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    const url = request.url();
    const line = `${request.method()} ${url} — ${failure}`;

    if (
      matchesFounderNoiseAllowlist(url, FOUNDER_NETWORK_NOISE_ALLOWLIST) ||
      matchesFounderNoiseAllowlist(failure, FOUNDER_NETWORK_NOISE_ALLOWLIST) ||
      matchesFounderNoiseAllowlist(line, FOUNDER_NETWORK_NOISE_ALLOWLIST)
    ) {
      return;
    }

    failedRequests.push(line);
  });

  page.on("response", (response: Response) => {
    const status = response.status();

    if (status < 500) {
      return;
    }

    const url = response.url();

    if (matchesFounderNoiseAllowlist(url, FOUNDER_NETWORK_NOISE_ALLOWLIST)) {
      return;
    }

    serverErrors.push(`${response.request().method()} ${url} — HTTP ${status}`);
  });

  return { pageErrors, consoleErrors, failedRequests, serverErrors };
}

export function formatFounderPageGuardProblems(capture: FounderPageGuardCapture): string[] {
  const problems: string[] = [];

  for (const item of capture.pageErrors) {
    problems.push(`pageerror: ${item}`);
  }

  for (const item of capture.consoleErrors) {
    problems.push(`console.error: ${item}`);
  }

  for (const item of capture.failedRequests) {
    problems.push(`requestfailed: ${item}`);
  }

  for (const item of capture.serverErrors) {
    problems.push(`http5xx: ${item}`);
  }

  return problems;
}

/**
 * Fail (default) or warn (`FOUNDER_PAGE_GUARDS_WARN_ONLY=1`) when unexpected noise was captured.
 */
export function assertFounderPageGuardsClean(capture: FounderPageGuardCapture): void {
  const problems = formatFounderPageGuardProblems(capture);

  if (problems.length === 0) {
    return;
  }

  const message = [
    `Founder page guards found ${problems.length} unexpected console/network defect(s):`,
    ...problems.map((line) => `  - ${line}`),
    "Allowlist benign noise in e2e/helpers/founder-page-noise-allowlist.ts or set FOUNDER_PAGE_GUARDS_WARN_ONLY=1.",
  ].join("\n");

  if (process.env.FOUNDER_PAGE_GUARDS_WARN_ONLY === "1") {
    console.warn(message);
    return;
  }

  throw new Error(message);
}
