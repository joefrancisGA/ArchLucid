using System.Text.Json;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Positive RBAC assignment evidence, not effective access or successful delivery.</summary>
internal static class AzureInventoryEventGridDestinationAuthorization
{
    public static bool HasMatchingAssignment(
        AzureInventoryEventGridSubscriptionRow subscription,
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<JsonElement> assignments)
    {
        string? target = subscription.DestinationResourceId;
        if (string.IsNullOrWhiteSpace(target))
            return false;
        string? provider = subscription.DestinationKind.ToUpperInvariant() switch
        {
            "EVENTHUB" => "/providers/Microsoft.EventHub/namespaces/",
            "SERVICEBUSQUEUE" or "SERVICEBUSTOPIC" => "/providers/Microsoft.ServiceBus/namespaces/",
            "STORAGEQUEUE" => "/providers/Microsoft.Storage/storageAccounts/",
            _ => null,
        };
        if (provider is null || !target.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase)
            || !target.Contains(provider, StringComparison.OrdinalIgnoreCase))
            return false;

        // A storage account reference alone does not identify the destination queue.
        // Only ancestor assignments on the observed account can be matched in that case.
        string? identityId = subscription.DeliveryAuthentication switch
        {
            AzureInventoryEventGridDeliveryAuthentication.SystemAssigned => subscription.SourceResourceId,
            AzureInventoryEventGridDeliveryAuthentication.UserAssigned =>
                AzureInventoryEventGridDeliveryAuthentication.ValidateIdentityResourceId(subscription.DeliveryUserAssignedIdentityResourceId),
            _ => null,
        };
        if (string.IsNullOrWhiteSpace(identityId))
            return false;

        var matches = resources.Where(resource => string.Equals(
            ArmResourceIdNormalizer.Normalize(resource.AzureResourceId),
            ArmResourceIdNormalizer.Normalize(identityId), StringComparison.OrdinalIgnoreCase)).Take(2).ToArray();
        if (matches.Length != 1)
            return false;

        string? principal;
        if (subscription.DeliveryAuthentication == AzureInventoryEventGridDeliveryAuthentication.SystemAssigned)
        {
            if (!AzureInventoryRuntimeIdentityReader.TryReadSystemAssignedPrincipalId(matches[0].Properties, out string systemPrincipal))
                return false;
            principal = systemPrincipal;
        }
        else
        {
            if (!matches[0].ResourceType.Equals("Microsoft.ManagedIdentity/userAssignedIdentities", StringComparison.OrdinalIgnoreCase))
                return false;
            principal = matches[0].Properties.FirstOrDefault(pair => pair.Key.Equals("principalId", StringComparison.OrdinalIgnoreCase)).Value;
        }

        if (!Guid.TryParse(principal, out Guid principalId) || principalId == Guid.Empty)
            return false;

        foreach (JsonElement assignment in assignments)
        {
            if (assignment.ValueKind != JsonValueKind.Object
                || !Guid.TryParse(Read(assignment, "principalId"), out Guid assignedPrincipal)
                || assignedPrincipal != principalId)
                continue;
            string? eligibility = Read(assignment, "pimEligibilityKind");
            if (!string.IsNullOrWhiteSpace(eligibility)
                && !eligibility.Equals("active", StringComparison.OrdinalIgnoreCase)
                && !eligibility.Equals("standing", StringComparison.OrdinalIgnoreCase))
                continue;
            // Conditional or malformed assignment evidence is not an unconditional grant.
            if (assignment.TryGetProperty("condition", out JsonElement condition)
                && condition.ValueKind != JsonValueKind.Null
                && !(condition.ValueKind == JsonValueKind.String && string.IsNullOrWhiteSpace(condition.GetString())))
                continue;
            string? scope = Read(assignment, "scope");
            string? roleId = Read(assignment, "roleDefinitionId");
            if (string.IsNullOrWhiteSpace(scope) || string.IsNullOrWhiteSpace(roleId)
                || !AzureInventoryControlToDataConversionResolver.RoleAssignmentScopeAppliesToResource(scope, target))
                continue;
            string? role = AzureInventoryBuiltInRoleDefinitionNames.TryResolveFromRoleDefinitionId(roleId);
            bool sender = subscription.DestinationKind.ToUpperInvariant() switch
            {
                "EVENTHUB" => role is "Azure Event Hubs Data Sender" or "Azure Event Hubs Data Owner",
                "SERVICEBUSQUEUE" or "SERVICEBUSTOPIC" => role is "Azure Service Bus Data Sender" or "Azure Service Bus Data Owner",
                "STORAGEQUEUE" => role is "Storage Queue Data Message Sender" or "Storage Queue Data Contributor",
                _ => false,
            };
            if (sender)
                return true;
        }

        return false;
    }

    private static string? Read(JsonElement row, string name) =>
        row.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() : null;
}
