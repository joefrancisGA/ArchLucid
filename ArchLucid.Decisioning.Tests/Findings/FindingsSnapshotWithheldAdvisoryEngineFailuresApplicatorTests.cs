using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotWithheldAdvisoryEngineFailuresApplicatorTests
{
    [Fact]
    public void Apply_maps_advisory_catalog_engine_failure_to_withheld_band()
    {
        FindingsSnapshot snapshot = new()
        {
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "cost-constraint",
                    Category = "Cost",
                    ErrorMessage = "offline",
                    ExceptionType = nameof(InvalidOperationException),
                    OccurredUtc = DateTime.UtcNow,
                },
            ],
        };

        FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator.Apply(snapshot);

        snapshot.WithheldFindings.Should().ContainSingle();
        snapshot.WithheldFindings[0].Reason.Should().Be(WithheldFindingReasons.EngineFailureAdvisory);
        snapshot.WithheldFindings[0].OriginEngineType.Should().Be("cost-constraint");
        snapshot.WithheldFindings[0].Title.Should().Contain("did not produce findings");
    }

    [Fact]
    public void Apply_skips_commit_blocking_security_failures()
    {
        FindingsSnapshot snapshot = new()
        {
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "security-baseline",
                    Category = "Security",
                    ErrorMessage = "boom",
                    ExceptionType = nameof(InvalidOperationException),
                    OccurredUtc = DateTime.UtcNow,
                },
            ],
        };

        FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator.Apply(snapshot);

        snapshot.WithheldFindings.Should().BeEmpty();
    }

    [Fact]
    public void CountCatalogAdvisoryFailures_counts_only_catalog_engine_types()
    {
        IReadOnlyList<FindingEngineFailure> failures =
        [
            new FindingEngineFailure
            {
                EngineType = "cost-constraint",
                Category = "Cost",
                ErrorMessage = "offline",
                ExceptionType = nameof(InvalidOperationException),
                OccurredUtc = DateTime.UtcNow,
            },
            new FindingEngineFailure
            {
                EngineType = "policy-pack-coverage",
                Category = "Policy",
                ErrorMessage = "missing",
                ExceptionType = nameof(InvalidOperationException),
                OccurredUtc = DateTime.UtcNow,
            },
        ];

        FindingsSnapshotWithheldAdvisoryEngineFailuresApplicator.CountCatalogAdvisoryFailures(failures)
            .Should()
            .Be(1);
    }
}
