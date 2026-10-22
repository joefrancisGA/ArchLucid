using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryRelationshipCompletenessIdx01Tests
{
    [Fact]
    public void Materialize_emits_arg_nic_subnet_missing_when_nic_has_no_subnet_ids()
    {
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [
                    new AzureExtractorExtendedResourceRow
                    {
                        AzureResourceId = nicArmId,
                        ResourceType = "Microsoft.Network/networkInterfaces",
                        Name = "nic1",
                        Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
                    },
                ],
                [],
                [],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false);

        result.CompletenessWarnings.Should().Contain(AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing);
    }

    [Fact]
    public void Materialize_maps_recaptured_network_associations_before_diagram_modes()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default";
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        AzureInventorySecurityEdgeMaterializeResult result =
            AzureInventorySecurityEdgeMaterializer.Materialize(
                [
                    CreateResource(vmArmId, "Microsoft.Compute/virtualMachines"),
                    CreateResource(nicArmId, "Microsoft.Network/networkInterfaces"),
                    CreateResource(peArmId, "Microsoft.Network/privateEndpoints"),
                    CreateResource(storageArmId, "Microsoft.Storage/storageAccounts"),
                ],
                [],
                [
                    ParseJson($$"""{"fromResourceId":"{{vmArmId}}","toResourceId":"{{nicArmId}}","associationType":"vmToNic"}"""),
                    ParseJson($$"""{"fromResourceId":"{{nicArmId}}","toResourceId":"{{subnetArmId}}","associationType":"nicToSubnet"}"""),
                    ParseJson($$"""{"fromResourceId":"{{peArmId}}","toResourceId":"{{subnetArmId}}","associationType":"peToSubnet"}"""),
                    ParseJson($$"""{"fromResourceId":"{{peArmId}}","toResourceId":"{{storageArmId}}","associationType":"privateEndpointTarget"}"""),
                ],
                [],
                [],
                [],
                federatedCredentialsFilePresent: false,
                [],
                entraGroupMembershipsFilePresent: false,
                [],
                effectiveNetworkControlsFilePresent: false,
                logicAppConnections: [],
                logicAppConnectionsFilePresent: true);

        result.CompletenessWarnings.Should().NotContain(AzureInventoryRelationshipCompletenessWarningCodes.ArgNicSubnetMissing);
        result.CompletenessWarnings.Should().NotContain(AzureInventoryRelationshipCompletenessWarningCodes.ArgPeTargetMissing);

        result.Relationships.Should().Contain(relationship =>
            relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(nicArmId)
            && relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(subnetArmId)
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);

        result.Relationships.Should().Contain(relationship =>
            relationship.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(peArmId)
            && relationship.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(storageArmId)
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryPrivateEndpoint);
    }

    private static AzureExtractorExtendedResourceRow CreateResource(string armId, string resourceType)
    {
        return new AzureExtractorExtendedResourceRow
        {
            AzureResourceId = armId,
            ResourceType = resourceType,
            Name = armId[(armId.LastIndexOf('/') + 1)..],
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
    }

    private static JsonElement ParseJson(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }
}
