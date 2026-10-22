import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import {
  CLOUD_FIRST_INVENTORY_COACH_EMPTY_TITLE,
  CLOUD_FIRST_INVENTORY_COACH_TITLE,
  CLOUD_FIRST_INVENTORY_START_REVIEW_HREF,
} from "@/lib/cloud-first-inventory-coach";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";

describe("CloudFirstInventoryCoach (TB-2222)", () => {
  it("renders attach and start-review steps with CTA after successful pull", () => {
    render(<CloudFirstInventoryCoach hasConnection hasSuccessfulPull />);

    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "post-pull");
    expect(screen.getByText(CLOUD_FIRST_INVENTORY_COACH_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach-step-attach")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach-step-start-review")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveAttribute(
      "href",
      CLOUD_FIRST_INVENTORY_START_REVIEW_HREF,
    );
    expect(screen.getByTestId("cloud-first-inventory-coach-cta")).toHaveTextContent(
      BUYER_START_ARCHITECTURE_REVIEW_CTA,
    );
  });

  it("uses empty phase copy when no connection exists without a hub duplicate CTA", () => {
    render(<CloudFirstInventoryCoach hasConnection={false} hasSuccessfulPull={false} />);

    expect(screen.getByTestId("cloud-first-inventory-coach")).toHaveAttribute("data-phase", "empty");
    expect(screen.getByText(CLOUD_FIRST_INVENTORY_COACH_EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(/0 of 3 cloud providers connected/i)).toBeInTheDocument();
    expect(screen.queryByTestId("cloud-first-inventory-coach-cta")).not.toBeInTheDocument();
  });
});
