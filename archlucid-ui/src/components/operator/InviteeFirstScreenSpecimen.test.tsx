import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InviteeFirstScreenSpecimen } from "@/components/operator/InviteeFirstScreenSpecimen";
import {
  INVITEE_FIRST_SCREEN_SPECIMEN_HEADING,
  INVITEE_FIRST_SCREEN_SPECIMEN_LEAD,
} from "@/lib/invitee-first-screen-specimen";

describe("InviteeFirstScreenSpecimen (TB-2235)", () => {
  it("renders finding → disposition → comment specimen steps", () => {
    render(<InviteeFirstScreenSpecimen />);

    expect(screen.getByTestId("invitee-first-screen-specimen")).toBeInTheDocument();
    expect(screen.getByText(INVITEE_FIRST_SCREEN_SPECIMEN_HEADING)).toBeInTheDocument();
    expect(screen.getByText(INVITEE_FIRST_SCREEN_SPECIMEN_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("invitee-first-screen-specimen-step-finding")).toBeInTheDocument();
    expect(screen.getByTestId("invitee-first-screen-specimen-step-disposition")).toBeInTheDocument();
    expect(screen.getByTestId("invitee-first-screen-specimen-step-comment")).toBeInTheDocument();
  });
});
