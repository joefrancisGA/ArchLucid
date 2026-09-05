using System.Text.RegularExpressions;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Detects generic cloud-security checklist phrasing that principal architects dismiss as obvious.
/// </summary>
public static partial class GenericArchitectureAdvicePatterns
{
    private static readonly string[] ObviousPhraseFragments =
    [
        // Provider-neutral
        "enable mfa",
        "enable multi-factor",
        "multi-factor authentication",
        "use https",
        "use tls",
        "enable tls",
        "encrypt data at rest",
        "encryption at rest",
        "implement least privilege",
        "principle of least privilege",
        "use strong password",
        "keep software updated",
        "apply security patches",
        "enable firewall",
        "enable logging",
        "enable diagnostic logging",
        "enable monitoring",
        "add monitoring",
        "ensure scalability",
        "implement backup",
        "disaster recovery plan",
        "use private endpoint",
        "enable rbac",
        "role-based access control",
        "rotate secrets",
        "use managed identit",
        "follow best practice",
        "security best practice",
        "cloud best practice",
        "defense in depth",
        "zero trust posture",
        "ensure compliance",
        "meet compliance requirement",
        // Azure
        "use azure monitor",
        "enable defender",
        "use key vault",
        "azure key vault",
        "well-architected framework",
        // AWS
        "cloudtrail",
        "enable cloudtrail",
        "use cloudtrail",
        "guardduty",
        "enable guardduty",
        "use guardduty",
        "security hub",
        "enable security hub",
        "use security hub",
        "aws kms",
        "use aws kms",
        "enable kms encryption",
        "iam roles",
        "use iam roles",
        "iam policies",
        "use iam policies",
        "security groups",
        "restrict security groups",
        "s3 public access block",
        "enable s3 public access block",
        "block s3 public access",
        "vpc flow logs",
        "enable vpc flow logs",
        "use vpc flow logs",
        "secrets manager",
        "use secrets manager",
        "aws waf",
        "enable aws waf",
        "use aws waf",
        // GCP
        "cloud audit logs",
        "enable cloud audit logs",
        "use cloud audit logs",
        "security command center",
        "enable security command center",
        "use security command center",
        "cloud kms",
        "use cloud kms",
        "enable cloud kms",
        "vpc service controls",
        "use vpc service controls",
        "enable vpc service controls",
        "use iam conditions",
        "enable iam conditions",
        "secret manager",
        "use secret manager",
        "cloud armor",
        "enable cloud armor",
        "use cloud armor",
        // Kubernetes
        "use network policies",
        "enable network policies",
        "implement network policies",
        "use pod security standards",
        "enable pod security admission",
        "implement pod security",
        "enforce rbac",
        "set resource limits",
        "set resource requests",
        "encrypt kubernetes secrets",
        "enable secrets encryption",
        "read-only root filesystem",
        "run as non-root",
        "use non-root user",
        "enable image scanning",
        "scan container images",
        "enable service mesh mtls",
        "use service mesh mtls",
    ];

    /// <summary>
    ///     True when the message reads like generic checklist advice without architecture-specific grounding.
    /// </summary>
    public static bool IsObviousGenericAdvice(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return false;

        string normalized = message.Trim().ToLowerInvariant();

        foreach (string fragment in ObviousPhraseFragments)
        {
            if (ContainsAffirmativeAdviceFragment(normalized, fragment))
                return true;
        }

        if (ImperativeGenericAdvice().IsMatch(normalized))
            return true;

        return false;
    }

    private static bool ContainsAffirmativeAdviceFragment(string normalized, string fragment)
    {
        int index = 0;

        while (index < normalized.Length)
        {
            index = normalized.IndexOf(fragment, index, StringComparison.Ordinal);

            if (index < 0)
                return false;

            if (!IsNegatedAdviceFragment(normalized, index)
                && !IsEmbeddedAdviceFragment(normalized, index))
                return true;

            index++;
        }

        return false;
    }

    private static bool IsEmbeddedAdviceFragment(string normalized, int fragmentIndex)
    {
        if (fragmentIndex > 0 && char.IsLetter(normalized[fragmentIndex - 1]))
            return true;

        return false;
    }

    private static bool IsNegatedAdviceFragment(string normalized, int fragmentIndex)
    {
        ReadOnlySpan<char> before = normalized.AsSpan(0, fragmentIndex).TrimEnd();

        if (before.Length < 2)
            return false;

        return before.EndsWith("do not", StringComparison.Ordinal)
            || before.EndsWith("do-not", StringComparison.Ordinal)
            || before.EndsWith("don't", StringComparison.Ordinal)
            || before.EndsWith("no requirement to", StringComparison.Ordinal)
            || before.EndsWith("not required to", StringComparison.Ordinal)
            || before.EndsWith("never", StringComparison.Ordinal)
            || before.EndsWith("without", StringComparison.Ordinal)
            || before.EndsWith("avoids", StringComparison.Ordinal)
            || before.EndsWith("avoid", StringComparison.Ordinal)
            || before.EndsWith("not", StringComparison.Ordinal)
            || before.EndsWith("no", StringComparison.Ordinal);
    }

    /// <summary>
    ///     True when the finding message anchors to a specific uploaded element, not generic posture.
    /// </summary>
    public static bool HasArchitectureSpecificAnchor(string? message, IReadOnlyList<string> evidenceRefs)
    {
        if (HasConcreteEvidenceCitation(evidenceRefs))
            return true;

        if (string.IsNullOrWhiteSpace(message))
            return false;

        string trimmed = message.Trim();

        if (ArchitectureAnchorPattern().IsMatch(trimmed))
            return true;

        if (UnderSpecifiedFindingPattern().IsMatch(trimmed))
            return true;

        if (ConflictFindingPattern().IsMatch(trimmed))
            return true;

        return false;
    }

    /// <summary>
    ///     True when the message encodes a falsifiable architecture signal (under-specified or conflict wording).
    /// </summary>
    public static bool HasFalsifiabilitySignal(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        string trimmed = message.Trim();

        if (UnderSpecifiedFindingPattern().IsMatch(trimmed))
        {
            return true;
        }

        if (ConflictFindingPattern().IsMatch(trimmed))
        {
            return true;
        }

        return false;
    }

    internal static bool HasConcreteEvidenceCitation(IReadOnlyList<string> evidenceRefs)
    {
        if (evidenceRefs.Count == 0)
            return false;

        foreach (string evidenceRef in evidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(evidenceRef))
                continue;

            string trimmed = evidenceRef.Trim();

            if (IsGenericEvidenceRef(trimmed))
                continue;

            if (trimmed.StartsWith("doc:", StringComparison.OrdinalIgnoreCase))
                return true;

            if (trimmed.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
                return true;

            if (trimmed.Contains("resourceGroups/", StringComparison.OrdinalIgnoreCase))
                return true;

            if (trimmed.Contains("services[", StringComparison.OrdinalIgnoreCase))
                return true;

            if (trimmed.Contains("datastores[", StringComparison.OrdinalIgnoreCase))
                return true;

            return true;
        }

        return false;
    }

    private static bool IsGenericEvidenceRef(string normalized)
    {
        return normalized.Equals("request", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("critic-checklist", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("architecture-request", StringComparison.OrdinalIgnoreCase);
    }

    [GeneratedRegex(
        @"(\/subscriptions\/|resourceGroups\/|doc:[^\s]+#L\d+|services\[\]|datastores\[\]|`[^`]+`|'[^']+'|\b[A-Z][a-zA-Z0-9]+(?:Api|Svc|Service|Gateway|Worker|Function|Queue|Store|Db|Sql)\b)",
        RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ArchitectureAnchorPattern();

    [GeneratedRegex(@"\b(UnderSpecified|Under-Specified|NotSpecified|Missing[A-Z][a-zA-Z]+)\b", RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex UnderSpecifiedFindingPattern();

    [GeneratedRegex(@"\b(conflicts? with|contradicts?|violates? constraint)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ConflictFindingPattern();

    [GeneratedRegex(
        @"^(enable|use|implement|ensure|consider|apply|adopt|configure|turn on|set up)\s+("
        + "mfa|https|tls|ssl|encryption|logging|monitoring|firewall|rbac|backups?|key vault|private endpoints?|managed identit"
        + "|cloudtrail|guardduty|security hub|kms|iam roles?|iam policies?|security groups?|secrets manager|secret manager"
        + "|waf|cloud armor|network polic|pod security|resource limits?|resource requests?|image scanning|service mesh mtls"
        + ")",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ImperativeGenericAdvice();
}
