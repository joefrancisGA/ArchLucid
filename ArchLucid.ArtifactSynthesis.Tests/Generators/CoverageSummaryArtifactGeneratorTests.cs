using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Generators;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CoverageSummaryArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_serializes_requirement_security_and_topology_counts()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Requirements = new RequirementsCoverageSection
            {
                Covered = [new RequirementCoverageItem { RequirementName = "R1" }],
                Uncovered = [new RequirementCoverageItem { RequirementName = "R2" }],
            },
            Security = new SecuritySection { Gaps = ["missing WAF"] },
            Compliance = new ComplianceSection { Gaps = ["SOC gap"] },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Title = "open issue" }],
            },
            Topology = new TopologySection { Gaps = ["no DR region"] },
        };

        CoverageSummaryArtifactGenerator sut = new();

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.CoverageSummary);

        using JsonDocument doc = JsonDocument.Parse(artifact.Content);
        JsonElement root = doc.RootElement;
        root.GetProperty("CoveredRequirementCount").GetInt32().Should().Be(1);
        root.GetProperty("UncoveredRequirementCount").GetInt32().Should().Be(1);
        root.GetProperty("SecurityGapCount").GetInt32().Should().Be(1);
        root.GetProperty("ComplianceGapCount").GetInt32().Should().Be(1);
        root.GetProperty("UnresolvedIssueCount").GetInt32().Should().Be(1);
        root.GetProperty("TopologyGaps").GetArrayLength().Should().Be(1);
    }
}
