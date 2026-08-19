using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ExpectedImpactTests
{
    [Fact]
    public void Defaults_summary_empty_and_rationale_null()
    {
        ExpectedImpact impact = new();

        impact.Summary.Should().BeEmpty();
        impact.Rationale.Should().BeNull();
    }

    [Fact]
    public void Initializers_round_trip_summary_and_rationale()
    {
        ExpectedImpact impact = new()
        {
            Summary = "Reduces outage risk.",
            Rationale = "Adds redundancy to Tier-1 paths.",
        };

        impact.Summary.Should().Be("Reduces outage risk.");
        impact.Rationale.Should().Be("Adds redundancy to Tier-1 paths.");
    }
}
