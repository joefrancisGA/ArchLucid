using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryDiagnosticDestinationParserTests
{
    [Fact]
    public void EnumerateDestinationArmIds_returns_workspace_storage_and_event_hub_destinations()
    {
        const string workspace =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/log1";
        const string storage =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/diagstore";
        const string eventHubRule =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1/authorizationRules/RootManageSharedAccessKey";

        using JsonDocument document = JsonDocument.Parse($$"""
                                                           {
                                                             "workspaceId": "{{workspace}}",
                                                             "storageAccountId": "{{storage}}",
                                                             "eventHubAuthorizationRuleId": "{{eventHubRule}}"
                                                           }
                                                           """);

        List<string> destinations = AzureInventoryDiagnosticDestinationParser
            .EnumerateDestinationArmIds(document.RootElement)
            .ToList();

        destinations.Should().Contain(ArmResourceIdNormalizer.Normalize(workspace));
        destinations.Should().Contain(ArmResourceIdNormalizer.Normalize(storage));
        destinations.Should().Contain(
            ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/eh1"));
    }
}
