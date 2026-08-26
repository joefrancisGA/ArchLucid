using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Deterministic security signals from infrastructure declaration properties on graph nodes.
/// </summary>
public static class DeclarationSecurityBaselineClassifier
{
    public readonly record struct DeclarationSecurityBaselineSignal(
        string Title,
        FindingSeverity Severity,
        string Theme);

    public static IReadOnlyList<DeclarationSecurityBaselineSignal> Classify(
        string resourceLabel,
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceLabel);
        ArgumentNullException.ThrowIfNull(properties);

        List<DeclarationSecurityBaselineSignal> findings = [];

        if (IsUnsafePublicNetworkAccess(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Storage or data service '{resourceLabel}' allows public network access.",
                FindingSeverity.Error,
                "data-protection"));
        }

        if (IsHttpsOnlyDisabled(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"App service '{resourceLabel}' does not require HTTPS only.",
                FindingSeverity.Warning,
                "transport-security"));
        }

        if (IsWeakSqlPosture(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"SQL server '{resourceLabel}' reports weak TLS posture or public network access enabled.",
                FindingSeverity.Error,
                "encryption"));
        }

        if (HasOpenAdminIngressHeuristic(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Network rule set on '{resourceLabel}' may allow administrative ingress from the internet.",
                FindingSeverity.Error,
                "network-isolation"));
        }

        return findings;
    }

    private static bool IsUnsafePublicNetworkAccess(IReadOnlyDictionary<string, string> properties)
    {
        if (TryGetProperty(properties, "tf.public_network_access", out string? publicNetworkAccess)
            && IsEnabledToken(publicNetworkAccess))
            return true;

        if (TryGetProperty(properties, "publicNetworkAccess", out string? armPublicNetworkAccess)
            && IsEnabledToken(armPublicNetworkAccess))
            return true;

        if (TryGetProperty(properties, "tf.allow_blob_public_access", out string? blobPublicAccess)
            && IsTruthy(blobPublicAccess))
            return true;

        if (TryGetProperty(properties, "allowBlobPublicAccess", out string? armBlobPublicAccess)
            && IsTruthy(armBlobPublicAccess))
            return true;

        return false;
    }

    private static bool IsHttpsOnlyDisabled(IReadOnlyDictionary<string, string> properties)
    {
        if (TryGetProperty(properties, "tf.https_only", out string? httpsOnly)
            && IsFalsy(httpsOnly))
            return true;

        if (TryGetProperty(properties, "httpsOnly", out string? armHttpsOnly)
            && IsFalsy(armHttpsOnly))
            return true;

        return false;
    }

    private static bool IsWeakSqlPosture(IReadOnlyDictionary<string, string> properties)
    {
        if (TryGetProperty(properties, "tf.minimum_tls_version", out string? minimumTlsVersion)
            && !string.IsNullOrWhiteSpace(minimumTlsVersion)
            && !string.Equals(minimumTlsVersion, "1.2", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(minimumTlsVersion, "1.3", StringComparison.OrdinalIgnoreCase))
            return true;

        if (TryGetProperty(properties, "tf.ssl_enforcement_enabled", out string? sslEnforcement)
            && IsFalsy(sslEnforcement))
            return true;

        if (TryGetProperty(properties, "tf.public_network_access", out string? sqlPublicAccess)
            && IsEnabledToken(sqlPublicAccess))
        {
            if (TryGetProperty(properties, "terraformType", out string? terraformType)
                && terraformType!.Contains("sql", StringComparison.Ordinal))
                return true;

            if (TryGetProperty(properties, "resourceType", out string? resourceType)
                && resourceType!.Contains("sql", StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static bool HasOpenAdminIngressHeuristic(IReadOnlyDictionary<string, string> properties)
    {
        string? ingressBlob = null;

        if (TryGetProperty(properties, "tf.ingress", out string? ingress))
            ingressBlob = ingress;

        if (ingressBlob is null && TryGetProperty(properties, "tf.network_rules", out string? networkRules))
            ingressBlob = networkRules;

        if (string.IsNullOrWhiteSpace(ingressBlob))
            return false;

        string normalized = ingressBlob.ToLowerInvariant();

        if (!normalized.Contains("0.0.0.0/0", StringComparison.Ordinal))
            return false;

        return normalized.Contains("22", StringComparison.Ordinal)
            || normalized.Contains("3389", StringComparison.Ordinal);
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        if (properties.TryGetValue(key, out string? directValue) && !string.IsNullOrWhiteSpace(directValue))
        {
            value = directValue.Trim();

            return true;
        }

        value = null;

        return false;
    }

    private static bool IsEnabledToken(string? value) =>
        string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool IsTruthy(string? value) =>
        string.Equals(value, "true", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "allow", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "enabled", StringComparison.OrdinalIgnoreCase);

    private static bool IsFalsy(string? value) =>
        string.Equals(value, "false", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "disabled", StringComparison.OrdinalIgnoreCase);
}
