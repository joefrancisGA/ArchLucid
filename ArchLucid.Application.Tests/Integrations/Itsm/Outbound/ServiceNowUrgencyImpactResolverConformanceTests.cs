using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ServiceNowUrgencyImpactResolverConformanceTests
{
    private const string ConnectorName = "ServiceNow urgency/impact resolver";

    [Theory]
    [InlineData(FindingSeverity.Critical, "1", "1")]
    [InlineData(FindingSeverity.Error, "2", "1")]
    [InlineData(FindingSeverity.Warning, "3", "2")]
    [InlineData(FindingSeverity.Info, "3", "3")]
    public void Resolve_maps_contract_severities(FindingSeverity severity, string expectedUrgency, string expectedImpact)
    {
        (string urgency, string impact) = ServiceNowUrgencyImpactResolver.Resolve(severity);

        urgency.Should().Be(expectedUrgency, because: $"{ConnectorName}: urgency must map contract severity.");
        impact.Should().Be(expectedImpact, because: $"{ConnectorName}: impact must map contract severity.");
    }
}
