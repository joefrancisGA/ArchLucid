using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Deterministic security signals from infrastructure declaration properties on graph nodes.
/// </summary>
public static partial class DeclarationSecurityBaselineClassifier
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
