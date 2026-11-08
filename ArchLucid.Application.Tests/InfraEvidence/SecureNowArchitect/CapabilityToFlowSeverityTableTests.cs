using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CapabilityToFlowSeverityTableTests
{
    [Fact]
    public void Resolve_insufficient_evidence_hop_does_not_default_to_medium_P05()
    {
        PrivilegePathSeverityResult result = CapabilityToFlowSeverityTable.Resolve(
            new CapabilityToFlowCandidate { HasInsufficientEvidenceHop = true });

        result.Severity.Should().BeEmpty();
    }
}
