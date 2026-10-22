using System.Text.RegularExpressions;

using ArchLucid.Contracts.Abstractions.Integrations;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Validates hosted extractor scope identifiers before they are embedded in ARM URLs (TB-084).
/// </summary>
public static partial class HostedAzureExtractorGuidValidator
{
    private const int MaxManagementGroupIdLength = 90;

    [GeneratedRegex("^[A-Za-z0-9._-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex ManagementGroupIdPattern();
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

    /// <summary>Requires a safe management group identifier suitable for ARM path segments.</summary>
    public static void RequireManagementGroupId(string parameterName, string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value, parameterName);

        string trimmed = value.Trim();

        if (trimmed.Length > MaxManagementGroupIdLength)
        {
            throw new ArgumentException(
                parameterName + " exceeds the maximum management group id length.",
                parameterName);
        }

        if (!ManagementGroupIdPattern().IsMatch(trimmed))
        {
            throw new ArgumentException(
                parameterName + " contains invalid characters for a management group id.",
                parameterName);
        }
    }

    /// <summary>Validates all WIF / scope identifiers on a collection request.</summary>
    public static void RequireCollectionRequestGuids(HostedAzureExtractorCollectionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        RequireAzureGuid(nameof(request.CustomerTenantId), request.CustomerTenantId);
        RequireAzureGuid(nameof(request.CustomerAppId), request.CustomerAppId);

        bool hasSubscriptionId = !string.IsNullOrWhiteSpace(request.SubscriptionId);
        bool hasManagementGroupId = !string.IsNullOrWhiteSpace(request.ManagementGroupId);

        if (hasSubscriptionId == hasManagementGroupId)
        {
            throw new ArgumentException(
                "Specify exactly one of SubscriptionId or ManagementGroupId.",
                hasSubscriptionId ? nameof(request.ManagementGroupId) : nameof(request.SubscriptionId));
        }

        if (hasSubscriptionId)
        {
            RequireAzureGuid(nameof(request.SubscriptionId), request.SubscriptionId!);
            return;
        }

        RequireManagementGroupId(nameof(request.ManagementGroupId), request.ManagementGroupId!);
    }
}
