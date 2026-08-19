import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorShellAccessRedirectsHost } from "@/components/shell/OperatorShellAccessRedirectsHost";

const useOperatorShellAccessRedirects = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useOperatorShellAccessRedirects", () => ({
  useOperatorShellAccessRedirects,
}));

describe("OperatorShellAccessRedirectsHost", () => {
  it("wires operator access redirects while deferred role gates load", () => {
    render(<OperatorShellAccessRedirectsHost />);

    expect(useOperatorShellAccessRedirects).toHaveBeenCalledTimes(1);
  });
});
