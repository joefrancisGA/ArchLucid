using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotListNormalizerTests
{
    [Fact]
    public void CoerceNullLists_replaces_nulls_with_empty_collections()
    {
        FindingsSnapshot snapshot = new()
        {
            EngineFailures = null!,
            Findings = null!,
            ChecklistCoverage = null!,
        };

        FindingsSnapshotListNormalizer.CoerceNullLists(snapshot);

        snapshot.EngineFailures.Should().BeEmpty();
        snapshot.Findings.Should().BeEmpty();
        snapshot.ChecklistCoverage.Should().BeEmpty();
    }

    [Fact]
    public void CoerceNullLists_keeps_populated_collections()
    {
        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "f-1",
                    FindingType = "SecurityGap",
                    Category = "Security",
                    EngineType = "Compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "Existing finding",
                },
            ],
        };

        FindingsSnapshotListNormalizer.CoerceNullLists(snapshot);

        snapshot.Findings.Should().ContainSingle();
    }

    [Fact]
    public void CoerceNullLists_rejects_null_snapshot()
    {
        Action act = () => FindingsSnapshotListNormalizer.CoerceNullLists(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
