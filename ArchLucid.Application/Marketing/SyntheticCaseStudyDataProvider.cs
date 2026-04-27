using ArchLucid.Persistence.Value;

namespace ArchLucid.Application.Marketing;

/// <summary>
///     Structured ROI-style metrics for the synthetic Contoso Retail case study — aligns with
///     <see cref="ValueReportRawMetrics" /> used by the value report DOCX path.
/// </summary>
public sealed class SyntheticCaseStudyDataProvider
{
    /// <summary>Hours per review cycle before ArchLucid (conservative sponsor estimate).</summary>
    public const decimal BaselineReviewCycleHours = 40m;

    /// <summary>Measured average review-cycle hours after ArchLucid (pilot window).</summary>
    public const decimal PostArchlucidReviewCycleHours = 12m;

    /// <summary>Manual evidence assembly hours before ArchLucid.</summary>
    public const decimal BaselineEvidenceAssemblyHours = 8m;

    /// <summary>Manual evidence assembly hours after ArchLucid.</summary>
    public const decimal PostArchlucidEvidenceAssemblyHours = 2m;

    /// <summary>Average review iterations before ArchLucid.</summary>
    public const decimal BaselineReviewIterations = 3m;

    /// <summary>Average review iterations after ArchLucid.</summary>
    public const decimal PostArchlucidReviewIterations = 1.5m;

    /// <summary>Returns metrics shaped like tenant value-report inputs for the synthetic Contoso Retail narrative.</summary>
    public ValueReportRawMetrics GetContosoRetailSyntheticMetrics(DateTimeOffset? capturedUtc = null)
    {
        DateTimeOffset utc = capturedUtc ?? new DateTimeOffset(2026, 3, 15, 12, 0, 0, TimeSpan.Zero);

        return new ValueReportRawMetrics(
            RunStatusCounts: [],
            RunsCompletedCount: 4,
            ManifestsCommittedCount: 4,
            GovernanceEventCount: 6,
            DriftAlertEventCount: 0,
            FindingFeedbackNetScore: 0,
            FindingFeedbackVoteCount: 0,
            TenantBaselineReviewCycleHours: BaselineReviewCycleHours,
            TenantBaselineReviewCycleSource: "Synthetic case study (Contoso Retail demo tenant)",
            TenantBaselineReviewCycleCapturedUtc: utc,
            MeasuredAverageReviewCycleHoursForWindow: PostArchlucidReviewCycleHours,
            MeasuredReviewCycleSampleSize: 4,
            TenantBaselineManualPrepHoursPerReview: BaselineEvidenceAssemblyHours,
            TenantBaselinePeoplePerReview: 4,
            TenantArchitectureTeamSize: 6);
    }
}
