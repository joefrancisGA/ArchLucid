using ArchLucid.Application.Marketing;
using ArchLucid.Persistence.Value;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Marketing;

[Trait("Suite", "Core")]
public sealed class SyntheticCaseStudyDataProviderTests
{
    [SkippableFact]
    public void GetContosoRetailSyntheticMetrics_review_cycle_roi_matches_baseline_delta()
    {
        SyntheticCaseStudyDataProvider sut = new();

        ValueReportRawMetrics raw = sut.GetContosoRetailSyntheticMetrics();

        raw.TenantBaselineReviewCycleHours.Should().Be(SyntheticCaseStudyDataProvider.BaselineReviewCycleHours);
        raw.MeasuredAverageReviewCycleHoursForWindow.Should().Be(SyntheticCaseStudyDataProvider.PostArchlucidReviewCycleHours);

        decimal baseline = SyntheticCaseStudyDataProvider.BaselineReviewCycleHours;
        decimal post = SyntheticCaseStudyDataProvider.PostArchlucidReviewCycleHours;
        decimal roiPct = (baseline - post) / baseline * 100m;

        roiPct.Should().BeApproximately(70m, 0.001m);
    }

    [SkippableFact]
    public void GetContosoRetailSyntheticMetrics_iteration_and_evidence_deltas_are_internally_consistent()
    {
        decimal iterBase = SyntheticCaseStudyDataProvider.BaselineReviewIterations;
        decimal iterPost = SyntheticCaseStudyDataProvider.PostArchlucidReviewIterations;
        decimal iterRoi = (iterBase - iterPost) / iterBase * 100m;

        iterRoi.Should().BeApproximately(50m, 0.001m);

        decimal evBase = SyntheticCaseStudyDataProvider.BaselineEvidenceAssemblyHours;
        decimal evPost = SyntheticCaseStudyDataProvider.PostArchlucidEvidenceAssemblyHours;
        decimal evRoi = (evBase - evPost) / evBase * 100m;

        evRoi.Should().BeApproximately(75m, 0.001m);
    }
}
