using System.Text.Json;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class AzureInventoryEventGridDestinationAuthorizationTests
{
    private const string Source = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic";
    private const string Identity = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity";
    private const string Principal = "11111111-1111-1111-1111-111111111111";
    private const string Target = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns/eventhubs/hub";
    private const string Sender = "2b629674-e913-4c01-ae53-ef4638d8f975";

    [Theory]
    [InlineData("system-assigned", Target, Sender, Principal, null, null, true)]
    [InlineData("user-assigned", "/subscriptions/sub/resourceGroups/rg", Sender, Principal, null, null, true)]
    [InlineData("system-assigned", Target, "a638d3c7-ab3a-418d-83e6-5f17a39d4fde", Principal, null, null, false)]
    [InlineData("system-assigned", "/subscriptions/other", Sender, Principal, null, null, false)]
    [InlineData("system-assigned", Target, Sender, "22222222-2222-2222-2222-222222222222", null, null, false)]
    [InlineData("system-assigned", Target, Sender, Principal, "eligible", null, false)]
    [InlineData("system-assigned", Target, Sender, Principal, null, "conditional", false)]
    [InlineData("unknown", Target, Sender, Principal, null, null, false)]
    public void Matches_only_observed_applicable_sender_assignments(
        string mode, string scope, string role, string principal, string? eligibility, string? condition, bool expected)
    {
        AzureInventoryEventGridSubscriptionRow subscription = new()
        {
            SourceResourceId = Source,
            DestinationResourceId = Target,
            DestinationKind = "EventHub",
            DeliveryAuthentication = mode,
            DeliveryUserAssignedIdentityResourceId = Identity,
        };
        AzureExtractorExtendedResourceRow[] resources =
        [
            new() { AzureResourceId = Source, ResourceType = "Microsoft.EventGrid/topics",
                Properties = new Dictionary<string, string> { ["identity"] = "{\"principalId\":\"" + Principal + "\"}" } },
            new() { AzureResourceId = Identity, ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                Properties = new Dictionary<string, string> { ["principalId"] = Principal } },
        ];
        JsonElement assignment = JsonSerializer.SerializeToElement(new
        {
            scope,
            principalId = principal,
            roleDefinitionId = role,
            pimEligibilityKind = eligibility,
            condition,
        });
        Assert.Equal(expected, AzureInventoryEventGridDestinationAuthorization.HasMatchingAssignment(
            subscription, resources, [assignment]));
    }

    [Fact]
    public void Missing_assignment_is_unverified()
    {
        Assert.False(AzureInventoryEventGridDestinationAuthorization.HasMatchingAssignment(
            new AzureInventoryEventGridSubscriptionRow(), [], []));
    }
}
