import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

import { ProjectsRecycleBinBuyerChrome } from "./ProjectsRecycleBinBuyerChrome";

describe("ProjectsRecycleBinBuyerChrome", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
  });

  it("renders bottom orientation strip in buyer shell", () => {
    render(<ProjectsRecycleBinBuyerChrome />);

    expect(screen.getByTestId("projects-recycle-bin-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-settings-sources")).toBeInTheDocument();
  });

  it("returns null outside buyer shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<ProjectsRecycleBinBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
