using System.Text.RegularExpressions;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

internal static partial class SecurityEvidencePathExplanationValidator
{
    [GeneratedRegex(@"/subscriptions/[^\s""']+/resourceGroups/[^\s""']+/providers/[^\s""']+", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ArmResourceIdPattern();

    public static IReadOnlyList<string> SelectAllowedEvidenceRefs(
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(hops);

        List<string> refs = [$"path:{pathId:D}"];

        foreach (SecurityEvidencePathHopRecord hop in hops.OrderBy(static item => item.HopOrdinal))
        {
            if (string.IsNullOrWhiteSpace(hop.EvidenceReference))
                continue;

            refs.Add(hop.EvidenceReference.Trim());
        }

        return refs.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    public static HashSet<string> CollectAllowedArmIds(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        ArgumentNullException.ThrowIfNull(hops);

        HashSet<string> allowed = new(StringComparer.OrdinalIgnoreCase);

        foreach (SecurityEvidencePathHopRecord hop in hops)
        {
            AddIfArm(allowed, hop.FromNodeId);
            AddIfArm(allowed, hop.ToNodeId);
            AddIfArm(allowed, hop.EvidenceReference);
        }

        return allowed;
    }

    public static IReadOnlyList<string> FilterCitedEvidenceRefs(
        IEnumerable<string> citedEvidenceRefs,
        IReadOnlyCollection<string> allowedEvidenceRefs)
    {
        HashSet<string> allowed = allowedEvidenceRefs.ToHashSet(StringComparer.OrdinalIgnoreCase);

        return citedEvidenceRefs
            .Where(reference => !string.IsNullOrWhiteSpace(reference))
            .Select(reference => reference.Trim())
            .Where(reference => allowed.Contains(reference))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static bool TrySanitizeArmReferences(
        string text,
        IReadOnlyCollection<string> allowedArmIds,
        out string sanitizedText,
        out IReadOnlyList<string> removedArmIds)
    {
        sanitizedText = text ?? string.Empty;
        List<string> removed = [];

        if (sanitizedText.Length == 0)
        {
            removedArmIds = removed;
            return true;
        }

        sanitizedText = ArmResourceIdPattern().Replace(
            sanitizedText,
            match =>
            {
                string normalized = ArmResourceIdNormalizer.Normalize(match.Value);

                if (allowedArmIds.Contains(normalized))
                    return match.Value;

                removed.Add(match.Value);
                return "[uncited-resource]";
            });

        removedArmIds = removed;
        return removed.Count == 0;
    }

    private static void AddIfArm(HashSet<string> allowed, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        Match match = ArmResourceIdPattern().Match(value);

        if (!match.Success)
            return;

        allowed.Add(ArmResourceIdNormalizer.Normalize(match.Value));
    }
}
