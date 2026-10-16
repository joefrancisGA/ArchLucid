namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Stable manifest / completeness warning codes when AKS workload image collection fails.
///     Format: <c>{base}:{reason}:{clusterResourceId}</c> (cluster id is a full ARM path).
/// </summary>
public static class AzureInventoryAksWorkloadImageCollectionWarnings
{
    public const string CustomerScriptBase = "aks-workload-images-not-collected-customer-script";

    public const string HostedBase = "aks-workload-images-not-collected-hosted";

    public const string ReasonInsufficientRbac = "insufficient-rbac";

    public const string ReasonMissingLogs = "missing-logs";

    public const string ReasonRunCommandFailed = "run-command-failed";

    public const string ReasonHttpError = "http-error";

    public const string ReasonPollTimeout = "poll-timeout";

    public const string ReasonUnavailable = "unavailable";

    public const string ReasonError = "error";

    public static string FormatCustomerScriptWarning(string reason, string clusterResourceId)
    {
        return Format(CustomerScriptBase, reason, clusterResourceId);
    }

    public static string FormatHostedWarning(string reason, string clusterResourceId)
    {
        return Format(HostedBase, reason, clusterResourceId);
    }

    public static bool TryParse(
        string? warning,
        out string? captureBase,
        out string? reason,
        out string? clusterResourceId)
    {
        captureBase = null;
        reason = null;
        clusterResourceId = null;

        if (string.IsNullOrWhiteSpace(warning))
        {
            return false;
        }

        string trimmed = warning.Trim();

        if (string.Equals(trimmed, CustomerScriptBase, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, HostedBase, StringComparison.OrdinalIgnoreCase))
        {
            captureBase = trimmed;
            reason = ReasonUnavailable;
            clusterResourceId = null;
            return true;
        }

        foreach (string baseCode in new[] { CustomerScriptBase, HostedBase })
        {
            string prefix = baseCode + ":";

            if (!trimmed.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string remainder = trimmed[prefix.Length..];
            int subscriptionIndex = remainder.IndexOf(
                "/subscriptions/",
                StringComparison.OrdinalIgnoreCase);

            if (subscriptionIndex <= 0)
            {
                return false;
            }

            string parsedReason = remainder[..subscriptionIndex].TrimEnd(':');

            if (string.IsNullOrWhiteSpace(parsedReason))
            {
                return false;
            }

            captureBase = baseCode;
            reason = parsedReason;
            clusterResourceId = remainder[subscriptionIndex..].Trim();
            return true;
        }

        return false;
    }

    public static string MapHttpStatusToReason(int statusCode)
    {
        if (statusCode is 401 or 403)
        {
            return ReasonInsufficientRbac;
        }

        return ReasonHttpError;
    }

    private static string Format(string baseCode, string reason, string clusterResourceId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(baseCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        ArgumentException.ThrowIfNullOrWhiteSpace(clusterResourceId);

        string normalizedClusterId = clusterResourceId.Trim().TrimEnd('/');

        return $"{baseCode}:{reason}:{normalizedClusterId}";
    }
}
