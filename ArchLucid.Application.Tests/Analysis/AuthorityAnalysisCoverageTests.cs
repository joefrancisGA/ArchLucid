using ArchLucid.Contracts.Analysis;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Analysis;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuthorityAnalysisCoverageTests
{
    private static readonly DateTime AsOf = new(2026, 11, 27, 14, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void No_snapshot_and_legacy_default_do_not_establish_absence()
    {
        Assert.False(AuthorityAnalysisCoverage.Evaluate(null).CanAssertAbsence);
        Assert.False(AuthorityAnalysisCoverage.Evaluate(new FindingsSnapshot { CreatedUtc = AsOf }).CanAssertAbsence);
        Assert.False(AuthorityAnalysisCoverage.Evaluate(new FindingsSnapshot
        {
            CreatedUtc = AsOf, GenerationStatus = FindingsSnapshotGenerationStatus.Complete, CoverageOutputUnavailable = true,
        }).CanAssertAbsence);
    }

    [Theory]
    [InlineData(FindingsSnapshotGenerationStatus.Generating, "pending")]
    [InlineData(FindingsSnapshotGenerationStatus.Failed, "failed")]
    [InlineData(FindingsSnapshotGenerationStatus.PartiallyComplete, "incomplete")]
    public void Empty_snapshot_is_not_complete_without_success(FindingsSnapshotGenerationStatus status, string state)
    {
        AnalysisCoverageSummary result = AuthorityAnalysisCoverage.Evaluate(new FindingsSnapshot
        {
            CreatedUtc = AsOf, GenerationStatus = status,
        });

        Assert.Equal(state, result.State);
        Assert.False(result.CanAssertAbsence);
        Assert.NotEmpty(result.MissingSources);
    }

    [Fact]
    public void Exhausted_requirement_comparison_overrides_a_complete_header()
    {
        FindingsSnapshot snapshot = new()
        {
            CreatedUtc = AsOf,
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            RequirementComparisonRecovery = RequirementComparisonRecoveryCodes.RetryExhausted,
        };

        AnalysisCoverageSummary result = AuthorityAnalysisCoverage.Evaluate(snapshot);

        Assert.Equal("incomplete", result.State);
        Assert.Equal("retry_exhausted", result.Recovery);
        Assert.Contains("requirement_comparison", result.MissingSources);
        Assert.False(result.CanAssertAbsence);
    }

    [Fact]
    public void Recovered_snapshot_can_establish_absence_without_rewriting_previous_coverage()
    {
        FindingsSnapshot prior = new()
        {
            CreatedUtc = AsOf, GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
        };
        AnalysisCoverageSummary recovered = AuthorityAnalysisCoverage.Evaluate(new FindingsSnapshot
        {
            CreatedUtc = AsOf.AddMinutes(1), GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            RequirementComparisonRecovery = RequirementComparisonRecoveryCodes.RecoveredNoFindings,
        });

        Assert.False(AuthorityAnalysisCoverage.Evaluate(prior).CanAssertAbsence);
        Assert.Equal("historical", recovered.Freshness);
        Assert.Equal("recovered", recovered.Recovery);
        Assert.True(recovered.CanAssertAbsence);
        Assert.Contains("not", AnalysisCoverageCopy.Explain(recovered), StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("Cost", false)]
    [InlineData("Security", true)]
    public void Engine_failures_preserve_findings_but_not_absence_claims_or_exception_text(string category, bool blocking)
    {
        FindingsSnapshot snapshot = new()
        {
            CreatedUtc = AsOf, GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            Findings = [new Finding()],
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "example", Category = category, ErrorMessage = "sensitive-data", ExceptionType = "TimeoutException",
                },
            ],
        };

        AnalysisCoverageSummary result = AuthorityAnalysisCoverage.Evaluate(snapshot);

        Assert.False(result.CanAssertAbsence);
        Assert.Equal(blocking, AuthorityAnalysisCoverage.HasCommitBlockingFailures(snapshot));
        Assert.Equal(!blocking, result.AdvisoryOnlyDegradation);
        Assert.Single(snapshot.Findings);
        Assert.DoesNotContain("sensitive-data", System.Text.Json.JsonSerializer.Serialize(result), StringComparison.Ordinal);
    }
}
