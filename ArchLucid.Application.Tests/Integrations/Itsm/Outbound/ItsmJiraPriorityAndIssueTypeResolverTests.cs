using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmJiraPriorityAndIssueTypeResolverTests
{
    [Theory]
    [InlineData(FindingSeverity.Critical, false, "Blocker")]
    [InlineData(FindingSeverity.Error, false, "High")]
    [InlineData(FindingSeverity.Warning, false, "Medium")]
    [InlineData(FindingSeverity.Info, false, null)]
    [InlineData(FindingSeverity.Info, true, "Low")]
    public void TryJiraPriorityName_maps_contract_severities(FindingSeverity severity, bool sendInfo, string? expected) =>
        ItsmJiraPriorityAndIssueTypeResolver.TryJiraPriorityName(severity, sendInfo).Should().Be(expected);
}
