import type { NextRequest } from "next/server";

import {
  DEV_AGENT_EXECUTION_MODE_HEADER,
  isDevTestingOverridesEnabled,
  readDevAgentExecutionModeOverrideFromRequestCookies,
  resolveEffectiveDevAgentExecutionMode,
} from "@/lib/dev-testing-overrides";

/** Resolves the upstream dev agent execution mode header from the browser cookie (local dev only). */
export function resolveDevAgentExecutionModeUpstreamHeader(
  request: NextRequest,
): string | null {
  if (!isDevTestingOverridesEnabled()) {
    return null;
  }

  const cookieHeader = request.headers.get("cookie");

  if (cookieHeader === null || cookieHeader.trim().length === 0) {
    return resolveEffectiveDevAgentExecutionMode(null);
  }

  const override = readDevAgentExecutionModeOverrideFromRequestCookies({
    get(name: string) {
      const prefix = `${name}=`;
      const match = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix));

      if (match === undefined) {
        return undefined;
      }

      return { value: decodeURIComponent(match.slice(prefix.length)) };
    },
  });

  return resolveEffectiveDevAgentExecutionMode(override);
}

export function applyDevAgentExecutionModeUpstreamHeader(headers: Headers, request: NextRequest): void {
  const mode = resolveDevAgentExecutionModeUpstreamHeader(request);

  if (mode !== null) {
    headers.set(DEV_AGENT_EXECUTION_MODE_HEADER, mode);
  }
}
