using ArchLucid.Contracts.Abstractions.Integrations;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Validates hosted extractor scope identifiers before they are embedded in ARM URLs (TB-084).
/// </summary>
public static class HostedAzureExtractorGuidValidator
{
    /// <summary>Requires a non-empty GUID string suitable for ARM path segments.</summary>
    public static void RequireAzureGuid(string parameterName, string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, parameterName);

        string trimmed = value.Trim();

        if (!Guid.TryParse(trimmed, out Guid parsed) || parsed == Guid.Empty)
        {
            throw new ArgumentException(
                parameterName + " must be a non-empty GUID.",
                parameterName);
        }
    }

    /// <summary>Validates all WIF / subscription identifiers on a collection request.</summary>
    public static void RequireCollectionRequestGuids(HostedAzureExtractorCollectionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        RequireAzureGuid(nameof(request.CustomerTenantId), request.CustomerTenantId);
        RequireAzureGuid(nameof(request.CustomerAppId), request.CustomerAppId);
        RequireAzureGuid(nameof(request.SubscriptionId), request.SubscriptionId);
    }
}
