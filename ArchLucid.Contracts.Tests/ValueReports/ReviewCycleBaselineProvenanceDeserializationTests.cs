using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.ValueReports;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ValueReports;

[Trait("Category", "Unit")]
public sealed class ReviewCycleBaselineProvenanceDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_review_cycle_baseline_provenance_throws()
    {
        const string json = """
            {
              "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "workspaceId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "periodFromUtc": "2026-07-01T00:00:00Z",
              "periodToUtc": "2026-08-01T00:00:00Z",
              "runStatusRows": [],
              "runsCompletedCount": 1,
              "manifestsCommittedCount": 1,
              "governanceEventsHandledCount": 0,
              "driftAlertEventsCaughtCount": 0,
              "estimatedArchitectHoursSavedFromManifests": 0,
              "estimatedArchitectHoursSavedFromGovernanceEvents": 0,
              "estimatedArchitectHoursSavedFromDriftEvents": 0,
              "estimatedTotalArchitectHoursSaved": 0,
              "estimatedLlmCostForWindowUsd": 0,
              "estimatedLlmCostMethodologyNote": "n/a",
              "annualizedHoursValueUsd": 0,
              "annualizedLlmCostUsd": 0,
              "baselineAnnualSubscriptionAndOpsCostUsdFromRoiModel": 0,
              "netAnnualizedValueVersusRoiBaselineUsd": 0,
              "roiAnnualizedPercentVersusRoiBaseline": 0,
              "measuredReviewCycleSampleSize": 0,
              "reviewCycleBaselineProvenance": 99,
              "findingFeedbackNetScore": 0,
              "findingFeedbackVoteCount": 0
            }
            """;

        Action act = () => JsonSerializer.Deserialize<ValueReportSnapshot>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_review_cycle_baseline_provenance()
    {
        const string json = """
            {
              "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              "workspaceId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
              "periodFromUtc": "2026-07-01T00:00:00Z",
              "periodToUtc": "2026-08-01T00:00:00Z",
              "runStatusRows": [],
              "runsCompletedCount": 1,
              "manifestsCommittedCount": 1,
              "governanceEventsHandledCount": 0,
              "driftAlertEventsCaughtCount": 0,
              "estimatedArchitectHoursSavedFromManifests": 0,
              "estimatedArchitectHoursSavedFromGovernanceEvents": 0,
              "estimatedArchitectHoursSavedFromDriftEvents": 0,
              "estimatedTotalArchitectHoursSaved": 0,
              "estimatedLlmCostForWindowUsd": 0,
              "estimatedLlmCostMethodologyNote": "n/a",
              "annualizedHoursValueUsd": 0,
              "annualizedLlmCostUsd": 0,
              "baselineAnnualSubscriptionAndOpsCostUsdFromRoiModel": 0,
              "netAnnualizedValueVersusRoiBaselineUsd": 0,
              "roiAnnualizedPercentVersusRoiBaseline": 0,
              "measuredReviewCycleSampleSize": 0,
              "reviewCycleBaselineProvenance": 0,
              "findingFeedbackNetScore": 0,
              "findingFeedbackVoteCount": 0
            }
            """;

        ValueReportSnapshot snapshot = JsonSerializer.Deserialize<ValueReportSnapshot>(json, ContractJson.Default)!;

        snapshot.ReviewCycleBaselineProvenance.Should().Be(ReviewCycleBaselineProvenance.TenantSuppliedAtSignup);
    }
}
