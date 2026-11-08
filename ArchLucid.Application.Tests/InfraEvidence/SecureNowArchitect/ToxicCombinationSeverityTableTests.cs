using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ToxicCombinationSeverityTableTests
{
    [Fact]
    public void Resolve_insufficient_evidence_hop_does_not_invent_high_severity_P08()
    {
        PrivilegePathSeverityResult result = ToxicCombinationSeverityTable.Resolve(
            new ToxicCombinationCandidate { HasInsufficientEvidenceHop = true });

        result.Severity.Should().BeEmpty();
    }
}
