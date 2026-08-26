import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IanaTimeZoneCombobox } from "@/components/preferences/IanaTimeZoneCombobox";

vi.mock("@/lib/advisory-schedule-form", () => ({
  resolveBrowserTimeZoneId: () => "America/New_York",
}));

describe("IanaTimeZoneCombobox", () => {
  it("renders a friendly closed label with the current UTC offset", () => {
    render(<IanaTimeZoneCombobox ianaTimeZoneId="America/New_York" onIanaTimeZoneIdChange={vi.fn()} />);

    expect(screen.getByTestId("iana-time-zone-combobox-trigger")).toHaveTextContent("Eastern Time — New York");
    expect(screen.getByTestId("iana-time-zone-combobox-trigger")).toHaveTextContent(/UTC/);
    expect(screen.getByTestId("iana-time-zone-current-time-preview")).toHaveTextContent(/Currently/i);
  });

  it("opens a searchable list with device, recent, and all sections", () => {
    render(<IanaTimeZoneCombobox ianaTimeZoneId="America/New_York" onIanaTimeZoneIdChange={vi.fn()} />);

    fireEvent.click(screen.getByTestId("iana-time-zone-combobox-trigger"));

    expect(screen.getByTestId("iana-time-zone-combobox-search")).toBeInTheDocument();
    expect(screen.getByTestId("iana-time-zone-combobox-device-option")).toHaveTextContent("Use device time zone");
    expect(screen.getByText("All time zones")).toBeInTheDocument();
  });

  it("filters results when searching by city", () => {
    render(<IanaTimeZoneCombobox ianaTimeZoneId="America/New_York" onIanaTimeZoneIdChange={vi.fn()} />);

    fireEvent.click(screen.getByTestId("iana-time-zone-combobox-trigger"));
    fireEvent.change(screen.getByTestId("iana-time-zone-combobox-search"), { target: { value: "Chicago" } });

    const panel = screen.getByTestId("iana-time-zone-combobox-panel");

    expect(within(panel).getByText("Central Time — Chicago")).toBeInTheDocument();
    expect(within(panel).queryByText("Pacific Time — Los Angeles")).not.toBeInTheDocument();
  });

  it("calls onChange with the stored IANA id when a zone is selected", () => {
    const onChange = vi.fn();

    render(<IanaTimeZoneCombobox ianaTimeZoneId="America/New_York" onIanaTimeZoneIdChange={onChange} />);

    fireEvent.click(screen.getByTestId("iana-time-zone-combobox-trigger"));
    fireEvent.change(screen.getByTestId("iana-time-zone-combobox-search"), { target: { value: "Chicago" } });
    fireEvent.click(screen.getByText("Central Time — Chicago"));

    expect(onChange).toHaveBeenCalledWith("America/Chicago");
  });
});
