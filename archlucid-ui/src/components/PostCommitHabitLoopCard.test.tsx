import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PostCommitHabitLoopCard } from "@/components/PostCommitHabitLoopCard";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

describe("PostCommitHabitLoopCard", () => {
  it("demotes the sponsor primary to optional links when the page Do-this-next strip owns primary", () => {
    render(
      <PostCommitHabitLoopCard
        runId="run-1"
        goldenManifestId="manifest-1"
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.queryByTestId("post-commit-habit-primary")).not.toBeInTheDocument();
    expect(screen.getByTestId("post-commit-habit-primary-as-optional")).toBeInTheDocument();
  });
});
