using ArchiForge.ContextIngestion.Models;

namespace ArchiForge.ContextIngestion.Canonicalization;

public class CanonicalDeduplicator : ICanonicalDeduplicator
{
    public IReadOnlyList<CanonicalObject> Deduplicate(
        IEnumerable<CanonicalObject> items)
    {
        return items
            .GroupBy(
                x => $"{x.ObjectType}|{x.Name}|{GetStableText(x)}",
                StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();
    }

    private static string GetStableText(CanonicalObject item)
    {
        return item.Properties.TryGetValue("text", out var text)
            ? text
            : string.Empty;
    }
}
