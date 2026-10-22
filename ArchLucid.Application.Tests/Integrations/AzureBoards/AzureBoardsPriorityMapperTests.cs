using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.AzureBoards;

[Trait("Category", "Unit")]
public sealed class AzureBoardsPriorityMapperTests
{
    [Theory]
    [InlineData(FindingSeverity.Critical, 1)]
    [InlineData(FindingSeverity.Error, 2)]
    [InlineData(FindingSeverity.Warning, 3)]
    public void TryMapPriority_maps_severity_to_azure_priority(FindingSeverity severity, int expected)
    {
        AzureBoardsPriorityMapper.TryMapPriority(severity).Should().Be(expected);
    }

    [Fact]
    public void TryMapPriority_returns_null_for_informational_findings()
    {
        AzureBoardsPriorityMapper.TryMapPriority(FindingSeverity.Info).Should().BeNull();
    }
}
