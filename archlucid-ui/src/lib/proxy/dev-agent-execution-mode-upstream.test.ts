import { describe, expect, it, vi } from "vitest";

import { DEV_AGENT_EXECUTION_MODE_COOKIE } from "@/lib/dev-testing-overrides";
import { resolveDevAgentExecutionModeUpstreamHeader } from "@/lib/proxy/dev-agent-execution-mode-upstream";

function createRequest(cookie: string | null): { headers: { get: (name: string) => string | null } } {
  return {
    headers: {
      get(name: string) {
        if (name === "cookie") {
          return cookie;
        }

        return null;
      },
    },
  };
}

describe("dev-agent-execution-mode-upstream", () => {
  it("defaults to Real when no cookie is present", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(resolveDevAgentExecutionModeUpstreamHeader(createRequest(null) as never)).toBe("Real");
  });

  it("forwards Simulator when the dev cookie is set", () => {
    vi.stubEnv("NODE_ENV", "development");

    const cookie = `${DEV_AGENT_EXECUTION_MODE_COOKIE}=Simulator; Path=/`;

    expect(resolveDevAgentExecutionModeUpstreamHeader(createRequest(cookie) as never)).toBe("Simulator");
  });
});
