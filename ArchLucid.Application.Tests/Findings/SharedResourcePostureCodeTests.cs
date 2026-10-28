using ArchLucid.Application.Findings.PortfolioSharedTopology;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SharedResourcePostureCodeTests
{
    [Fact]
    public void TryDerive_omits_replica_segment_when_no_replica_property_keys_exist()
    {
        bool derived = SharedResourcePostureCode.TryDerive(
            new Dictionary<string, string> { ["publicNetworkAccess"] = "Disabled" },
            out string postureCode);

        derived.Should().BeTrue();
        postureCode.Should().NotContain("Replica=");
    }

    [Fact]
    public void TryDerive_labels_disabled_replica_property_as_stored_disabled()
    {
        bool derived = SharedResourcePostureCode.TryDerive(
            new Dictionary<string, string> { ["geo_redundant"] = "false" },
            out string postureCode);

        derived.Should().BeTrue();
        postureCode.Should().Contain("Replica=stored disabled");
    }
}
