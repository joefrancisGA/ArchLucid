using ArchLucid.Core.Findings;
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

        if (IsPrivilegedWorkload(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Workload '{resourceLabel}' declares a privileged container.",
                FindingSeverity.Error,
                "workload-isolation"));
        }

        if (IsHostNetworkWorkload(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Workload '{resourceLabel}' enables host network access.",
                FindingSeverity.Warning,
                "network-isolation"));
        }

        if (AllowsPrivilegeEscalation(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Workload '{resourceLabel}' allows container privilege escalation.",
                FindingSeverity.Warning,
                "workload-isolation"));
        }

        if (IsPublicLoadBalancerService(properties))
        {
            findings.Add(new DeclarationSecurityBaselineSignal(
                $"Service '{resourceLabel}' exposes a LoadBalancer endpoint.",
                FindingSeverity.Warning,
                "data-protection"));
        }

        return findings;
    }

    private static bool IsUnsafePublicNetworkAccess(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? publicNetworkAccess)
            && IsEnabledToken(publicNetworkAccess))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess,
                out _,
                out string? blobPublicAccess)
            && IsTruthy(blobPublicAccess))
            return true;

        return false;
    }

    private static bool IsHttpsOnlyDisabled(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.HttpsOnly,
                out _,
                out string? httpsOnly)
            && IsFalsy(httpsOnly))
            return true;

        return false;
    }

    private static bool IsWeakSqlPosture(IReadOnlyDictionary<string, string> properties)
    {
        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion,
                out _,
                out string? minimumTlsVersion)
            && !string.IsNullOrWhiteSpace(minimumTlsVersion)
            && !string.Equals(minimumTlsVersion, "1.2", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(minimumTlsVersion, "1.3", StringComparison.OrdinalIgnoreCase))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled,
                out _,
                out string? sslEnforcement)
            && IsFalsy(sslEnforcement))
            return true;

        if (DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                out _,
                out string? sqlPublicAccess)
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
        if (!DeclarationSecurityPropertyKeyResolver.TryGet(
                properties,
                DeclarationSecurityPropertyLogicalNames.IngressBlob,
                out _,
                out string? ingressBlob)
            || string.IsNullOrWhiteSpace(ingressBlob))
            return false;

        string normalized = ingressBlob.ToLowerInvariant();

        if (!normalized.Contains("0.0.0.0/0", StringComparison.Ordinal))
            return false;

        return ContainsIsolatedPort(normalized, 22)
            || ContainsIsolatedPort(normalized, 3389);
    }

    private static bool IsPrivilegedWorkload(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "privileged");

    private static bool IsHostNetworkWorkload(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "hostNetwork");

    private static bool AllowsPrivilegeEscalation(IReadOnlyDictionary<string, string> properties) =>
        TryGetK8sTruthy(properties, "allowPrivilegeEscalation");

    private static bool IsPublicLoadBalancerService(IReadOnlyDictionary<string, string> properties)
    {
        if (!TryGetProperty(properties, "k8s.servicetype", out string? serviceType))
            return false;

        return string.Equals(serviceType, "loadbalancer", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryGetK8sTruthy(IReadOnlyDictionary<string, string> properties, string keySuffix)
    {
        if (!TryGetProperty(properties, $"k8s.{keySuffix}", out string? value))
            return false;

        return IsTruthy(value);
    }

    private static bool ContainsIsolatedPort(string normalized, int port)
    {
        string portText = port.ToString();

        for (int index = 0; index <= normalized.Length - portText.Length; index++)
        {
            if (!normalized.AsSpan(index, portText.Length).SequenceEqual(portText))
                continue;

            bool beforeIsDigit = index > 0 && char.IsDigit(normalized[index - 1]);
            int afterIndex = index + portText.Length;

            if (beforeIsDigit)
                continue;

            if (afterIndex < normalized.Length && char.IsDigit(normalized[afterIndex]))
                continue;

            return true;
        }

        return false;
    }

    private static bool TryGetProperty(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(entry.Value))
                continue;

            value = entry.Value.Trim();

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
