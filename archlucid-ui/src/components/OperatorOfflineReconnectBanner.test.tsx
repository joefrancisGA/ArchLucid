import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { OperatorOfflineReconnectBanner } from "@/components/OperatorOfflineReconnectBanner";
import {
  OPERATOR_OFFLINE_RECONNECT_BODY,
  OPERATOR_OFFLINE_RECONNECT_TITLE,
} from "@/lib/operator-offline-reconnect";
import { createOperatorQueryClient } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

function stubNavigatorOnline(online: boolean): void {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => online,
  });
}

describe("OperatorOfflineReconnectBanner", () => {
  beforeEach(() => {
    stubNavigatorOnline(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is hidden while online", () => {
    renderWithOperatorQuery(<OperatorOfflineReconnectBanner />);

    expect(screen.queryByTestId("operator-offline-reconnect")).not.toBeInTheDocument();
  });

  it("shows strip on offline event and hides on online", async () => {
    stubNavigatorOnline(false);

    renderWithOperatorQuery(<OperatorOfflineReconnectBanner />);

    expect(await screen.findByTestId("operator-offline-reconnect")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_OFFLINE_RECONNECT_TITLE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_OFFLINE_RECONNECT_BODY)).toBeInTheDocument();

    stubNavigatorOnline(true);
    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
      expect(screen.queryByTestId("operator-offline-reconnect")).not.toBeInTheDocument();
    });
  });

  it("shows strip when offline event fires while mounted online", async () => {
    renderWithOperatorQuery(<OperatorOfflineReconnectBanner />);

    expect(screen.queryByTestId("operator-offline-reconnect")).not.toBeInTheDocument();

    stubNavigatorOnline(false);
    window.dispatchEvent(new Event("offline"));

    expect(await screen.findByTestId("operator-offline-reconnect")).toBeInTheDocument();
  });

  it("Retry invalidates TanStack Query caches", async () => {
    stubNavigatorOnline(false);

    const queryClient = createOperatorQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined as never);

    renderWithOperatorQuery(<OperatorOfflineReconnectBanner />, { queryClient });

    expect(await screen.findByTestId("operator-offline-reconnect")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("operator-offline-reconnect-retry"));

    await waitFor(() => {
      expect(invalidateQueries).toHaveBeenCalled();
    });
  });
});