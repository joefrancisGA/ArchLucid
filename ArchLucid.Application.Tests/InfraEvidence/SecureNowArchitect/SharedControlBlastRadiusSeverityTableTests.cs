using ArchLucid.Application.InfraEvidence.SecureNowArchitect;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence.SecureNowArchitect;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SharedControlBlastRadiusSeverityTableTests
{
    [Fact]
    public void Resolve_zero_dependents_does_not_invent_medium_severity_P07()
    {
        PrivilegePathSeverityResult result = SharedControlBlastRadiusSeverityTable.Resolve(
            new SharedControlBlastRadiusCandidate { DependentCount = 0 });

        result.Severity.Should().BeEmpty();
    }
}
