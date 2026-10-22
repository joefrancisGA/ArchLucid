using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidGrowthFunnelMeters
{
    /// <summary>Manual prep / people-per-review baseline persisted (settings UI gate).</summary>
    public static readonly Counter<long> BaselineManualPrepCapturedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_baseline_manual_prep_captured_total",
            description: "Tenant manual baseline fields saved (PUT /v1/tenant/baseline).");

    /// <summary>
    ///     Guided Core Pilot checklist progress from the operator shell (labels:
    ///     <c>step</c> = canonical slug; four steps only — low cardinality).
    /// </summary>
    public static readonly Counter<long> CorePilotRailChecklistStepsTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_core_pilot_rail_checklist_step_total",
            description:
            "Operator-shell Core Pilot checklist step acknowledgements POST /v1/diagnostics/core-pilot-rail-step (label step slug).");

    /// <summary>First successful golden-manifest commit per tenant (Core Pilot onboarding funnel).</summary>
    public static readonly Counter<long> FirstSessionCompletedTotal =
        ArchLucidAppMeter.Instance.CreateCounter<long>(
            "archlucid_first_session_completed_total",
            description: "Increments once per tenant on first successful manifest commit.");

    /// <summary>
    ///     Age in hours of unanswered marketing pricing quote requests (labels: <c>breach_status</c>).
    ///     Populated every five minutes by <c>MarketingPricingQuoteAgingMetricsHostedService</c>.
    /// </summary>
    public static readonly Histogram<double> PricingQuoteRequestAgeHours =
        ArchLucidAppMeter.Instance.CreateHistogram(
            "archlucid_pricing_quote_request_age_hours",
            "hours",
            "Age in hours of unanswered marketing pricing quote requests.",
            advice: new InstrumentAdvice<double>
            {
                HistogramBucketBoundaries =
                [
                    1, 6, 12, 18, 24, 48, 72, 168
                ]
            });

    /// <summary>
    ///     Wall-clock minutes from wizard run creation to first committed manifest (TB-220; labels
    ///     <c>execution_mode</c>, <c>preset_used</c>).
    /// </summary>
    public static readonly Histogram<double> WizardToCommittedMinutes =
        ArchLucidAppMeter.Instance.CreateHistogram<double>(
            "archlucid.pilot.wizard_to_committed_minutes",
            "min",
            "Wall-clock minutes from wizard submit to first committed manifest (labels execution_mode, preset_used).");

    private static readonly string[] CorePilotRailChecklistSteps =
        ["create_request", "track_review", "finalize_review_package", "review_outputs"];

    /// <summary>Increments <see cref="BaselineManualPrepCapturedTotal" />.</summary>
    public static void RecordBaselineManualPrepCaptured()
    {
        BaselineManualPrepCapturedTotal.Add(1);
    }

    /// <summary>Increments <see cref="CorePilotRailChecklistStepsTotal" /> for checklist step indices 0–3 inclusive.</summary>
    public static void RecordCorePilotRailChecklistStep(int stepIndex)
    {
        if (stepIndex < 0 || stepIndex >= CorePilotRailChecklistSteps.Length)
            throw new ArgumentOutOfRangeException(
                nameof(stepIndex),
                stepIndex,
                $"stepIndex must be 0..{CorePilotRailChecklistSteps.Length - 1}");

        TagList tags = new() { { "step", CorePilotRailChecklistSteps[stepIndex] } };

        CorePilotRailChecklistStepsTotal.Add(1, tags);
    }

    /// <summary>Increments <see cref="FirstSessionCompletedTotal" /> once per tenant (caller must gate).</summary>
    public static void RecordFirstSessionCompleted()
    {
        FirstSessionCompletedTotal.Add(1);
    }

    /// <summary>Records <see cref="WizardToCommittedMinutes" /> for wizard-sourced runs (TB-220).</summary>
    public static void RecordWizardToCommittedMinutes(double minutes, string executionMode, string presetUsed)
    {
        double clampedMinutes = minutes < 0 ? 0 : minutes;
        string mode = string.IsNullOrWhiteSpace(executionMode) ? "unknown" : executionMode.Trim().ToLowerInvariant();
        string preset = string.IsNullOrWhiteSpace(presetUsed) ? "unknown" : presetUsed.Trim().ToLowerInvariant();
        TagList tags = new()
        {
            { "execution_mode", mode },
            { "preset_used", preset },
        };

        WizardToCommittedMinutes.Record(clampedMinutes, tags);
    }

    /// <summary>Records one pricing quote request age observation for SLA histogram export.</summary>
    public static void RecordPricingQuoteRequestAgeHours(double ageHours, string breachStatus)
    {
        if (ageHours < 0)
            ageHours = 0;

        if (string.IsNullOrWhiteSpace(breachStatus))
            breachStatus = "unknown";

        KeyValuePair<string, object?>[] tags =
        [
            new KeyValuePair<string, object?>("breach_status", breachStatus)
        ];

        PricingQuoteRequestAgeHours.Record(ageHours, tags.AsSpan());
    }
}
