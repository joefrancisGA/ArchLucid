import { render, screen } from "@testing-library/react";
import { Suspense, isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { extractUploadSettingsPathForProductLine } from "@/lib/extract-upload-settings-route";

const { resolveProductLineIdForServer, redirect } = vi.hoisted(() => ({
  resolveProductLineIdForServer: vi.fn<() => Promise<ProductLineId>>(),
  redirect: vi.fn(),
}));

vi.mock("./_sections/ExtractUploadSettingsPageClient", () => ({
  ExtractUploadSettingsPageClient: () => <div data-testid="extract-upload-settings-page-client">Extract client</div>,
}));

vi.mock("@/lib/product-line/resolve-product-line-id-server", () => ({
  resolveProductLineIdForServer,
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  redirect,
}));

import ExtractUploadSettingsPage from "./page";
import { ExtractUploadSettingsPageLoading } from "./_sections/ExtractUploadSettingsPageLoading";

describe("ExtractUploadSettingsPage", () => {
  beforeEach(() => {
    resolveProductLineIdForServer.mockReset();
    redirect.mockReset();
  });

  it("wraps the client in Suspense for useSearchParams hydration", async () => {
    resolveProductLineIdForServer.mockResolvedValue("architecture");

    const element = await ExtractUploadSettingsPage();

    expect(isValidElement(element)).toBe(true);

    if (!isValidElement(element)) {
      throw new Error("Expected page export to be a React element.");
    }

    expect(element.type).toBe(Suspense);
    expect((element.props as { fallback?: unknown }).fallback).toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects SecureNow to its infrastructure extract-upload route", async () => {
    resolveProductLineIdForServer.mockResolvedValue("security");

    await ExtractUploadSettingsPage();

    expect(redirect).toHaveBeenCalledWith(extractUploadSettingsPathForProductLine("security"));
  });

  it("renders the loading view with extract-upload copy", () => {
    render(<ExtractUploadSettingsPageLoading />);

    expect(screen.getByRole("heading", { name: "Extract & upload" })).toBeInTheDocument();
    expect(screen.getByTestId("extract-upload-settings-page-loading")).toHaveTextContent(
      /loading extract and upload workspace/i,
    );
  });
});
