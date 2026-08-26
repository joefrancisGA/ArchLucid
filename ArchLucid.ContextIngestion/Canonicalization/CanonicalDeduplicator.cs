using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Canonicalization;

public class CanonicalDeduplicator : ICanonicalDeduplicator
{
    public IReadOnlyList<CanonicalObject> Deduplicate(
        IEnumerable<CanonicalObject> items)
    {
        return items
            .GroupBy(
                x => $"{x.ObjectType}|{x.Name}|{GetDedupeFingerprint(x)}|{GetDedupeScopeSuffix(x)}",
                StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();
    }

    private static string GetDedupeScopeSuffix(CanonicalObject item)
    {
        if (string.Equals(item.SourceType, "PolicyReference", StringComparison.OrdinalIgnoreCase))
            return string.Empty;

        return item.SourceId ?? string.Empty;
    }

    /// <summary>
    ///     Stable identity for deduplication. Precedence: <c>text</c> → <c>reference</c> →
    ///     <c>terraformType</c> → <c>resourceType</c> → <c>k8s.kind</c> → empty.
    /// </summary>
    internal static string GetDedupeFingerprint(CanonicalObject item)
    {
        if (item.Properties.TryGetValue("text", out string? text) && !string.IsNullOrEmpty(text))
            return text;

        if (item.Properties.TryGetValue("reference", out string? reference) && !string.IsNullOrEmpty(reference))
            return reference;

        if (item.Properties.TryGetValue("terraformType", out string? terraformType) &&
            !string.IsNullOrEmpty(terraformType))
        {
            if (item.Properties.TryGetValue("terraformOccurrence", out string? occurrence) &&
                !string.IsNullOrWhiteSpace(occurrence))
                return $"{terraformType}|occurrence:{occurrence.Trim().ToLowerInvariant()}";

            return terraformType;
        }

        if (item.Properties.TryGetValue("resourceType", out string? resourceType) &&
            !string.IsNullOrEmpty(resourceType))
            return InfrastructureDeclarationResourceIdentity.BuildResourceTypeFingerprint(item.Properties);

        if (item.Properties.TryGetValue("k8s.kind", out string? k8sKind) &&
            !string.IsNullOrEmpty(k8sKind))
            return k8sKind;

        return string.Empty;
    }
}
