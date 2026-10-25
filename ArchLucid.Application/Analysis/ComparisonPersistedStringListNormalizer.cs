namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims persisted comparison list strings and drops whitespace-only entries.
/// </summary>
internal static class ComparisonPersistedStringListNormalizer
{
    internal static void NormalizeInPlace(List<string> items)
    {
        for (int i = items.Count - 1; i >= 0; i--)
        {
            if (string.IsNullOrWhiteSpace(items[i]))
            {
                items.RemoveAt(i);
                continue;
            }

            items[i] = items[i].Trim();
        }

        DedupeInPlace(items);
    }

    private static void DedupeInPlace(List<string> items)
    {
        if (items.Count < 2)
            return;

        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);
        List<string> distinct = [];

        foreach (string item in items)
        {
            if (!seen.Add(item))
                continue;

            distinct.Add(item);
        }

        if (distinct.Count == items.Count)
            return;

        items.Clear();
        items.AddRange(distinct);
    }
}
