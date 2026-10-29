namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureArmNextLinkValidator
{
    private const string SubscriptionsPathPrefix = "/subscriptions/";

    private const string ManagementGroupsPathPrefix = "/providers/Microsoft.Management/managementGroups/";

    private const string DiagnosticSettingsPathSuffix = "/providers/Microsoft.Insights/diagnosticSettings";

    private const string FederatedIdentityCredentialsPathSuffix = "/federatedIdentityCredentials";

    private const string BuiltInPolicyDefinitionsPathPrefix = "/providers/Microsoft.Authorization/policyDefinitions";

    public static void EnsureTargetsSubscription(string nextLink, string subscriptionId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped ARM resource listing due to an invalid nextLink.");

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

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped diagnostic setting listing due to an invalid nextLink.");

        string normalizedResourceId = resourceId.Trim();
        string expectedPathPrefix = normalizedResourceId + DiagnosticSettingsPathSuffix;

        if (!uri.AbsolutePath.Equals(expectedPathPrefix, StringComparison.OrdinalIgnoreCase)
            && !uri.AbsolutePath.StartsWith(expectedPathPrefix + "/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped diagnostic setting listing because nextLink targets a different resource.");
        }
    }

    public static void EnsureTargetsFederatedCredentialsIdentity(string nextLink, string identityResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(identityResourceId);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped federated credential listing due to an invalid nextLink.");

        string normalizedIdentityResourceId = identityResourceId.Trim();
        string expectedPathPrefix = normalizedIdentityResourceId + FederatedIdentityCredentialsPathSuffix;

        if (!uri.AbsolutePath.Equals(expectedPathPrefix, StringComparison.OrdinalIgnoreCase)
            && !uri.AbsolutePath.StartsWith(expectedPathPrefix + "/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped federated credential listing because nextLink targets a different identity.");
        }
    }

    public static void EnsureTargetsBuiltInPolicyDefinitionsListing(string nextLink)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped built-in policy definition listing due to an invalid nextLink.");

        string absolutePath = uri.AbsolutePath;

        if (!absolutePath.Equals(BuiltInPolicyDefinitionsPathPrefix, StringComparison.OrdinalIgnoreCase)
            && !absolutePath.StartsWith(BuiltInPolicyDefinitionsPathPrefix + "/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped built-in policy definition listing because nextLink targets a different collection.");
        }
    }

    public static void EnsureTargetsArmRelativeListingPath(string nextLink, string listingRelativePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(listingRelativePath);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped ARM resource listing due to an invalid nextLink.");

        string normalizedListingPath = "/" + listingRelativePath.Trim().TrimStart('/');
        string absolutePath = uri.AbsolutePath;

        if (!absolutePath.Equals(normalizedListingPath, StringComparison.OrdinalIgnoreCase)
            && !absolutePath.StartsWith(normalizedListingPath + "/", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing because nextLink targets a different resource scope.");
        }
    }

    public static void EnsureTargetsExactArmRelativeListingPath(string nextLink, string listingRelativePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(listingRelativePath);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped ARM resource listing due to an invalid nextLink.");

        string normalizedListingPath = "/" + listingRelativePath.Trim().TrimStart('/');
        string absolutePath = uri.AbsolutePath;

        if (!absolutePath.Equals(normalizedListingPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM resource listing because nextLink targets a different resource scope.");
        }
    }

    public static void EnsureTargetsFactoryResource(string nextLink, string factoryResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        ArgumentException.ThrowIfNullOrWhiteSpace(factoryResourceId);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped ADF factory listing due to an invalid nextLink.");

        string normalizedFactoryResourceId = "/" + factoryResourceId.Trim().TrimStart('/');
        string expectedPathPrefix = normalizedFactoryResourceId + "/";

        if (!uri.AbsolutePath.StartsWith(expectedPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ADF factory listing because nextLink targets a different factory.");
        }
    }

    public static void EnsureTargetsManagementGroup(string nextLink, string managementGroupId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(nextLink);
        HostedAzureExtractorGuidValidator.RequireManagementGroupId(nameof(managementGroupId), managementGroupId);

        Uri uri = ParseTrustedPaginationUri(
            nextLink,
            "Hosted Azure extractor stopped ARM management group listing due to an invalid nextLink.");

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

    private static Uri ParseTrustedPaginationUri(string nextLink, string invalidUriMessage)
    {
        if (!Uri.TryCreate(nextLink, UriKind.Absolute, out Uri? uri))
        {
            throw new InvalidOperationException(invalidUriMessage);
        }

        EnsureTrustedPaginationUri(uri);

        return uri;
    }

    private static void EnsureTrustedPaginationUri(Uri uri)
    {
        if (!uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM pagination because nextLink must use HTTPS.");
        }

        if (!HostedAzureArmTrustedManagementHosts.IsTrusted(uri.Host))
        {
            throw new InvalidOperationException(
                "Hosted Azure extractor stopped ARM pagination because nextLink targets an untrusted host.");
        }
    }
}
