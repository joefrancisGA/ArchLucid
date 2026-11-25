using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridDeliveryAuthenticationTests
{
    [Theory]
    [InlineData("""{"deliveryWithResourceIdentity":{"identity":{"type":"SystemAssigned"},"destination":{"endpointType":"EventHub"}}}""", "system-assigned")]
    [InlineData("""{"deliveryWithResourceIdentity":{"identity":{"type":"UserAssigned","userAssignedIdentity":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1"},"destination":{"endpointType":"StorageQueue"}}}""", "user-assigned")]
    [InlineData("""{"deliveryWithResourceIdentity":{"identity":{"type":"UserAssigned"},"destination":{"endpointType":"EventHub"}}}""", "unknown")]
    [InlineData("""{"destination":{"endpointType":"WebHook","properties":{"azureActiveDirectoryTenantId":"11111111-1111-1111-1111-111111111111","azureActiveDirectoryApplicationIdOrUri":"api://audience"}}}""", "entra-webhook")]
    [InlineData("""{"destination":{"endpointType":"WebHook","properties":{"endpointUrl":"https://example.com/hook?secret=private"}}}""", "direct-unverified")]
    [InlineData("""{"destination":{"endpointType":"EventHub"}}""", "direct-unverified")]
    [InlineData("""{"destination":{"endpointType":"EventHub"},"deliveryWithResourceIdentity":{"identity":{"type":"SystemAssigned"},"destination":{"endpointType":"StorageQueue"}}}""", "unknown")]
    [InlineData("{}", "unknown")]
    public void Resolve_classifies_delivery_configuration(string json, string expected)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        Assert.Equal(expected, AzureInventoryEventGridDeliveryAuthentication.Resolve(document.RootElement));
    }

    [Fact]
    public void Sanitizer_extracts_identity_wrapped_destination_and_only_retains_authentication_mode()
    {
        using JsonDocument document = JsonDocument.Parse("""
            {"name":"delivery1","properties":{"deliveryWithResourceIdentity":{
            "identity":{"type":"SystemAssigned"},
            "destination":{"endpointType":"EventHub","properties":{"resourceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns/eventhubs/hub"}}}}}
            """);

        Assert.True(AzureInventoryEventGridSubscriptionSanitizer.TrySanitizeFromArmResource(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic", document.RootElement, out var row));
        Assert.NotNull(row);
        Assert.Equal("system-assigned", row.DeliveryAuthentication);
        Assert.Equal("EventHub", row.DestinationKind);
        Assert.EndsWith("/eventhubs/hub", row.DestinationResourceId);
    }

    [Fact]
    public void Parser_handles_legacy_rows_and_rejects_unrecognized_authentication_labels()
    {
        using JsonDocument document = JsonDocument.Parse("""
            {"sourceResourceId":"source","subscriptionName":"name","collectionStatus":"Succeeded","deliveryAuthentication":"secret-value"}
            """);
        Assert.True(AzureInventoryEventGridSubscriptionParser.TryParse(document.RootElement, out var row, out _));
        Assert.NotNull(row);
        Assert.Equal("unknown", row.DeliveryAuthentication);
    }
}
