using System.Collections.Generic;

using ArchLucid.Decisioning.Analysis;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class DrReplicaPropertyHeuristicTests
{
    [Fact]
    public void HasReplicaEvidence_returns_false_when_zone_redundant_is_no_token()
    {
        IReadOnlyDictionary<string, string> properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["zone_redundant"] = "no",
        };

        DrReplicaPropertyHeuristic.HasReplicaEvidence(properties).Should().BeFalse();
    }

    [Fact]
    public void HasReplicaEvidence_returns_true_when_zone_redundant_is_yes_token()
    {
        IReadOnlyDictionary<string, string> properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["zone_redundant"] = "yes",
        };

        DrReplicaPropertyHeuristic.HasReplicaEvidence(properties).Should().BeTrue();
    }
}