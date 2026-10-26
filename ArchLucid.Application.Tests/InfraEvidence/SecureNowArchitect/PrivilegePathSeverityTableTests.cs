using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class PrivilegePathSeverityTableTests
{
    [Fact]
    public void Resolve_blank_role_does_not_invent_severity()
    {
        PrivilegePathSeverityResult result = PrivilegePathSeverityTable.Resolve("   ", hasInsufficientEvidenceHop: false, scopeTaggedProduction: false);

        result.Severity.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_unrecognized_role_does_not_default_to_medium()
    {
        PrivilegePathSeverityResult result = PrivilegePathSeverityTable.Resolve(
            "Custom.Role.Definition",
            hasInsufficientEvidenceHop: false,
            scopeTaggedProduction: false);

        result.Severity.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_insufficient_evidence_hop_does_not_assign_medium_severity()
    {
        PrivilegePathSeverityResult result = PrivilegePathSeverityTable.Resolve(
            "Owner",
            hasInsufficientEvidenceHop: true,
            scopeTaggedProduction: false);

        result.Severity.Should().BeEmpty();
    }
}
