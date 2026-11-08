import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ITSM_TICKET_STATE_NOT_STORED,
  ItsmLinkedTicketStatusChip,
} from "@/components/findings/ItsmLinkedTicketStatusChip";

describe("ItsmLinkedTicketStatusChip", () => {
  it("labels missing ticket state when summary omits parentheses", () => {
    render(<ItsmLinkedTicketStatusChip summary="KEY-1" />);

    expect(screen.getByText("KEY-1")).toBeInTheDocument();
    expect(screen.getByText(ITSM_TICKET_STATE_NOT_STORED)).toBeInTheDocument();
  });

  it("labels whitespace-only ticket state honestly", () => {
    render(<ItsmLinkedTicketStatusChip summary="ARCH-9 (   )" />);

    expect(screen.getByText("ARCH-9")).toBeInTheDocument();
    expect(screen.getByText(ITSM_TICKET_STATE_NOT_STORED)).toBeInTheDocument();
  });
});
