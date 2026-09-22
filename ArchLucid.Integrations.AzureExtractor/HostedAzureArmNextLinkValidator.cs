namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureArmNextLinkValidator
{
    private const string SubscriptionsPathPrefix = "/subscriptions/";

    private const string ManagementGroupsPathPrefix = "/providers/Microsoft.Management/managementGroups/";

    private const string DiagnosticSettingsPathSuffix = "/providers/Microsoft.Insights/diagnosticSettings";

    private const string FederatedIdentityCredentialsPathSuffix = "/federatedIdentityCredentials";

    public static void EnsureTargetsSubscription(string nextLink, string subscriptionId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing due to an invalid nextLink.");
        }

        string normalizedSubscriptionId = subscriptionId.Trim();
        string? nextLinkSubscriptionId = TryGetSubscriptionId(uri.AbsolutePath);

        if (nextLinkSubscriptionId is null ||
            !string.Equals(nextLinkSubscriptionId, normalizedSubscriptionId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing because nextLink targets a different subscription.");
        }
    }

    private static string? TryGetSubscriptionId(string absolutePath)
    {
        if (!absolutePath.StartsWith(SubscriptionsPathPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        ReadOnlySpan<char> remainder = absolutePath.AsSpan(SubscriptionsPathPrefix.Length);
        int slashIndex = remainder.IndexOf('/');

        ReadOnlySpan<char> subscriptionId = slashIndex < 0
            ? remainder
            : remainder[..slashIndex];

        if (subscriptionId.IsEmpty)
            return null;

        return subscriptionId.ToString();
    }

    public static void EnsureTargetsDiagnosticSettingsResource(string nextLink, string resourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped diagnostic setting listing due to an invalid nextLink.");
        }

        string normalizedResourceId = resourceId.Trim();
        string expectedPathPrefix = normalizedResourceId + DiagnosticSettingsPathSuffix;

        if (!uri.AbsolutePath.StartsWith(expectedPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped diagnostic setting listing because nextLink targets a different resource.");
        }
    }

    public static void EnsureTargetsFederatedCredentialsIdentity(string nextLink, string identityResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(identityResourceId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped federated credential listing due to an invalid nextLink.");
        }

        string normalizedIdentityResourceId = identityResourceId.Trim();
        string expectedPathPrefix = normalizedIdentityResourceId + FederatedIdentityCredentialsPathSuffix;

        if (!uri.AbsolutePath.StartsWith(expectedPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped federated credential listing because nextLink targets a different identity.");
        }
    }

    public static void EnsureTargetsManagementGroup(string nextLink, string managementGroupId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM management group listing due to an invalid nextLink.");
        }

        string normalizedManagementGroupId = managementGroupId.Trim();
        string? nextLinkManagementGroupId = TryGetManagementGroupId(uri.AbsolutePath);

        if (nextLinkManagementGroupId is null ||
            !string.Equals(nextLinkManagementGroupId, normalizedManagementGroupId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM management group listing because nextLink targets a different management group.");
        }
    }

    private static string? TryGetManagementGroupId(string absolutePath)
    {
        if (!absolutePath.StartsWith(ManagementGroupsPathPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        ReadOnlySpan<char> remainder = absolutePath.AsSpan(ManagementGroupsPathPrefix.Length);
        int slashIndex = remainder.IndexOf('/');

        ReadOnlySpan<char> managementGroupId = slashIndex < 0
            ? remainder
            : remainder[..slashIndex];

        if (managementGroupId.IsEmpty)
            return null;

        return managementGroupId.ToString();
    }
}
