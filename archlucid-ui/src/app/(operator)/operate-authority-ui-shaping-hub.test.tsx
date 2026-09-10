import "./operate-authority-ui-shaping.setup.tsx";

import { vi } from "vitest";

vi.mock("@/components/advisory/AdvisoryScheduleCreateFormFields", () => ({
  AdvisoryScheduleCreateFormFields: () => null,
}));

vi.mock("@/components/advisory/AdvisoryScheduleCreatePreview", () => ({
  AdvisoryScheduleCreatePreview: () => null,
}));

vi.mock("@/components/integrations/IntegrationConnectChecklist", () => ({
  IntegrationConnectChecklist: () => null,
}));

vi.mock("@/components/advisory/use-advisory-schedule-create-form", async () => {
  const { whyDisabledEnterpriseMutationControl } = await import("@/lib/why-disabled-cta");

  return {
    useAdvisoryScheduleCreateForm: (props: { canEdit: boolean }) => ({
      form: {
        name: "",
        nameTouched: false,
        frequency: "Weekly",
        dayOfWeek: "Monday",
        hour: 9,
        minute: 0,
        dayOfMonth: 1,
        customCron: "",
        timeZoneId: "UTC",
      },
      advancedOpen: false,
      setAdvancedOpen: vi.fn(),
      preview: { state: "idle" as const },
      customCronValid: true,
      setCustomCronValid: vi.fn(),
      ianaOptions: [],
      mutationDisabledHintId: "advisory-schedule-create-mutate-disabled-hint",
      mutationDisabledReason: props.canEdit ? null : whyDisabledEnterpriseMutationControl(),
    cronExpression: "0 9 * * 1",
    suggestedName: "Weekly schedule",
    frequencySummary: "Weekly on Monday at 09:00 UTC",
    formReady: true,
    showFormUpcomingPreview: false,
    advisoryCreateSteps: [],
    advisoryCreateEmphasizedStepId: null,
    updateForm: vi.fn(),
    onSubmit: vi.fn(),
    canEdit: props.canEdit,
    creating: false,
    createSuccess: false,
    }),
    ADVISORY_SCHEDULE_SELECT_CLASS: "",
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryScheduleCreateForm } from "@/components/advisory/AdvisoryScheduleCreateForm";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  advisorySchedulesCreateScheduleButtonLabelReaderRank,
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import { apiHoisted, mutateCapability } from "./operate-authority-ui-shaping.fixtures";

function AdvisoryScheduleAuthorityProbe() {
  const callerRank = useNavCallerAuthorityRank();
  const canEdit = callerRank >= AUTHORITY_RANK.AdminAuthority;

  return (
    <AdvisoryScheduleCreateForm
      canEdit={canEdit}
      sampleModeBlocked={false}
      creating={false}
      createSuccess={false}
      projectLabel="Current project"
      runProjectSlug="default"
      formResetKey={0}
      onCreate={async () => {}}
    />
  );
}

describe("Enterprise authority UI shaping — hub tabs", () => {
  it("Digest subscriptions: Create subscription stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await waitFor(() => {
      expect(apiHoisted.listDigestSubscriptions).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: digestSubscriptionsCreateSubscriptionButtonLabelReaderRank }),
      ).toBeDisabled();
    });
  });

  it("Advisory schedules: Create schedule submit stays disabled when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AdvisoryScheduleAuthorityProbe />);

    expect(screen.getByTestId("advisory-schedule-create-form")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: advisorySchedulesCreateScheduleButtonLabelReaderRank }),
    ).toBeDisabled();
  });
});
