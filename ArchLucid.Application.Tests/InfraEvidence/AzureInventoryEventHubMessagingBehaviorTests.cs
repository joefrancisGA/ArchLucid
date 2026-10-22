using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryEventHubMessagingBehaviorTests
{
    [Fact]
    public void MapAuthorizedAccess_emits_event_hub_data_sender_as_may_publish()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string webAppId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string principalId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = namespaceId,
                ResourceType = "Microsoft.EventHub/namespaces",
                ResourceGroup = "rg",
            },
            new()
            {
                AzureResourceId = webAppId,
                ResourceType = "Microsoft.Web/sites",
                ResourceGroup = "rg",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["identity"] = $$"""{"type":"SystemAssigned","principalId":"{{principalId}}"}""",
                },
            },
        ];

        using JsonDocument roleAssignment = JsonDocument.Parse($$"""
            {
              "scope": "{{namespaceId}}",
              "principalId": "{{principalId}}",
              "roleDefinitionId": "/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-000000000001",
              "roleDefinitionName": "Azure Event Hubs Data Sender"
            }
            """);

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryAppAuthorizedAccessEdgeMapper.MapAuthorizedAccess(
            resources,
            [roleAssignment.RootElement],
            relationships,
            keys,
            []);

        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(webAppId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(namespaceId)
            && r.RelationshipType == GraphEdgeTypes.CanWrite
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryEventHubMayPublish);
    }

    [Fact]
    public void Materialize_retargets_event_hub_diagnostic_destination_to_namespace()
    {
        const string namespaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ehns1";
        const string hubId = $"{namespaceId}/eventhubs/orders";
        const string vmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";

        using JsonDocument diagnostic = JsonDocument.Parse($$"""
            {
              "targetResourceId": "{{vmId}}",
              "name": "diag",
              "eventHubAuthorizationRuleId": "{{hubId}}/authorizationRules/RootManageSharedAccessKey"
            }
            """);

        AzureInventorySecurityEdgeMaterializeResult result = AzureInventorySecurityEdgeMaterializer.Materialize(
            [
                new AzureExtractorExtendedResourceRow
                {
                    AzureResourceId = namespaceId,
                    ResourceType = "Microsoft.EventHub/namespaces",
                    ResourceGroup = "rg",
                },
                new AzureExtractorExtendedResourceRow
                {
                    AzureResourceId = vmId,
                    ResourceType = "Microsoft.Compute/virtualMachines",
                    ResourceGroup = "rg",
                },
            ],
            [],
            [],
            [],
            [diagnostic.RootElement],
            [],
            federatedCredentialsFilePresent: true,
            [],
            entraGroupMembershipsFilePresent: true,
            [],
            effectiveNetworkControlsFilePresent: true);

        result.Relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(vmId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(namespaceId)
            && r.InferenceSource == GraphEdgeInferenceSources.WithQualifier(
                GraphEdgeInferenceSources.InventoryDiagnosticDestination,
                "orders"));
    }
}
