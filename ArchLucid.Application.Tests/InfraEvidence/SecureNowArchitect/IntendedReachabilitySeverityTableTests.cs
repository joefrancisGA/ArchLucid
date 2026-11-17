using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class IntendedReachabilitySeverityTableTests
{
    [Fact]
    public void Resolve_insufficient_evidence_hop_does_not_assign_medium_severity()
    {
        PrivilegePathSeverityResult result = IntendedReachabilitySeverityTable.Resolve(
            hasInsufficientEvidenceHop: true,
            scopeTaggedProduction: true);

        result.Severity.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_production_scope_does_not_assign_standard_blast_radius()
    {
        PrivilegePathSeverityResult result = IntendedReachabilitySeverityTable.Resolve(
            hasInsufficientEvidenceHop: false,
            scopeTaggedProduction: true);

        result.BlastRadius.Should().Be(FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel);
        result.BusinessCriticality.Should().Be("Production");
    }
}
