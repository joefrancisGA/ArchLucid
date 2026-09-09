import { render, screen } from "@testing-library/react";
import { Suspense, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./_sections/ExtractUploadSettingsPageClient", () => ({
  ExtractUploadSettingsPageClient: () => <div data-testid="extract-upload-settings-page-client">Extract client</div>,
}));

import ExtractUploadSettingsPage from "./page";
import { ExtractUploadSettingsPageLoading } from "./_sections/ExtractUploadSettingsPageLoading";

describe("ExtractUploadSettingsPage", () => {
  it("wraps the client in Suspense for useSearchParams hydration", () => {
    const element = ExtractUploadSettingsPage();

    expect(isValidElement(element)).toBe(true);

    if (!isValidElement(element)) {
      throw new Error("Expected page export to be a React element.");
    }

    expect(element.type).toBe(Suspense);
    expect(element.props.fallback).toBeDefined();
  });

  it("renders the loading view with extract-upload copy", () => {
    render(<ExtractUploadSettingsPageLoading />);

    expect(screen.getByRole("heading", { name: "Extract & upload" })).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-settings-page-loading")).toHaveTextContent(
      /loading extract and upload workspace/i,
    );
  });
});
