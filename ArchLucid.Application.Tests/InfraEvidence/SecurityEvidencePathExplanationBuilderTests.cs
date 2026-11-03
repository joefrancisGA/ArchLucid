using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityEvidencePathExplanationBuilderTests
{
    [Fact]
    public void BuildSimulatorExplanation_prefixes_template_and_uses_not_stored_honesty()
    {
        SecurityEvidencePathRecord path = new()
        {
            PathId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Probable,
            CanonicalHopHashSha256 = [1, 2, 3],
            WeakestHopOrdinal = 1,
            WeakestHopReason = "",
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        SecurityEvidencePathExplanationContent content =
            SecurityEvidencePathExplanationBuilder.BuildSimulatorExplanation(path, [], [], []);

        content.ExecutiveSummary.Should().StartWith("Simulator template, not a stored inference:");
        content.ExecutiveSummary.Should().Contain("Weakest-hop reason was not stored.");
        content.ExecutiveSummary.Should().Contain("Cited evidence was not stored.");
    }
}
