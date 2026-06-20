using System.Text.RegularExpressions;

namespace ArchLucid.Core.Findings;

/// <summary>
///     Detects generic cloud-security checklist phrasing that principal architects dismiss as obvious.
/// </summary>
public static partial class GenericArchitectureAdvicePatterns
{
    private static readonly string[] ObviousPhraseFragments =
    [
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
        "use azure monitor",
        "enable defender",
        "implement backup",
        "disaster recovery plan",
        "use private endpoint",
        "use key vault",
        "azure key vault",
        "enable rbac",
        "role-based access control",
        "rotate secrets",
        "use managed identit",
        "follow best practice",
        "security best practice",
        "cloud best practice",
        "well-architected framework",
        "defense in depth",
        "zero trust posture",
        "ensure compliance",
        "meet compliance requirement",
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
            if (normalized.Contains(fragment, StringComparison.Ordinal))
                return true;
        }

        if (ImperativeGenericAdvice().IsMatch(normalized))
            return true;

        return false;
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
        @"^(enable|use|implement|ensure|consider|apply|adopt|configure|turn on|set up)\s+(mfa|https|tls|ssl|encryption|logging|monitoring|firewall|rbac|backups?|key vault|private endpoints?|managed identit)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled)]
    private static partial Regex ImperativeGenericAdvice();
}
