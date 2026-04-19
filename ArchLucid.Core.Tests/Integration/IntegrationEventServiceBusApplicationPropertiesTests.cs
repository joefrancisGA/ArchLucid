using System.Text;
using System.Text.Json;

using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventServiceBusApplicationPropertiesTests
{
    [Fact]
    public void TryResolveForPublish_governance_promotion_maps_environment_to_user_property()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes(
            JsonSerializer.Serialize(
                new
                {
                    schemaVersion = 1,
                    environment = "Prod",
                }));

        IReadOnlyDictionary<string, object>? props =
            IntegrationEventServiceBusApplicationProperties.TryResolveForPublish(
                IntegrationEventTypes.GovernancePromotionActivatedV1,
                utf8);

        props.Should().NotBeNull();
        props![IntegrationEventServiceBusApplicationProperties.PromotionEnvironmentPropertyName].Should().Be("prod");
    }

    [Fact]
    public void TryResolveForPublish_non_promotion_event_returns_null()
    {
        byte[] utf8 = Encoding.UTF8.GetBytes("{\"environment\":\"prod\"}");

        IntegrationEventServiceBusApplicationProperties
            .TryResolveForPublish(IntegrationEventTypes.AlertFiredV1, utf8)
            .Should()
            .BeNull();
    }
}
