using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Integrations;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Integrations;

[Trait("Category", "Unit")]
public sealed class TeamsIncomingWebhookDeserializationTests
{
    [Fact]
    public void Deserialize_null_enabled_triggers_yields_empty_list_not_null()
    {
        const string json = """
            {
              "tenantId": "00000000-0000-0000-0000-000000000001",
              "isConfigured": false,
              "enabledTriggers": null
            }
            """;

        TeamsIncomingWebhookConnectionResponse? result =
            JsonSerializer.Deserialize<TeamsIncomingWebhookConnectionResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.EnabledTriggers.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_trigger_catalog_yields_empty_list_not_null()
    {
        const string json = """
            {
              "connection": {
                "tenantId": "00000000-0000-0000-0000-000000000001",
                "isConfigured": false
              },
              "triggerCatalog": null
            }
            """;

        TeamsIncomingWebhookPageBundleResponse? result =
            JsonSerializer.Deserialize<TeamsIncomingWebhookPageBundleResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.TriggerCatalog.Should().NotBeNull().And.BeEmpty();
    }
}
