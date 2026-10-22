namespace ArchLucid.Persistence.Coordination.Compare;

public sealed partial class AuthorityCompareService
{
    private static void CompareStringLists(
        ManifestComparisonResult result,
        string section,
        IEnumerable<string>? left,
        IEnumerable<string>? right)
    {
        HashSet<string> leftSet = new(left ?? [], StringComparer.OrdinalIgnoreCase);
        HashSet<string> rightSet = new(right ?? [], StringComparer.OrdinalIgnoreCase);

        foreach (string item in leftSet.Except(rightSet, StringComparer.OrdinalIgnoreCase))

            result.Diffs.Add(new DiffItem
            {
                Section = section, Key = item, DiffKind = DiffKind.Removed, BeforeValue = item
            });


        foreach (string item in rightSet.Except(leftSet, StringComparer.OrdinalIgnoreCase))

            result.Diffs.Add(new DiffItem
            {
                Section = section, Key = item, DiffKind = DiffKind.Added, AfterValue = item
            });
    }

    private static void CompareKeyedSets<T>(
        ManifestComparisonResult result,
        string section,
        IDictionary<string, T> left,
        IDictionary<string, T> right,
        Func<T, string?> primaryLeft,
        Func<T, string?> primaryRight,
        Func<T, string?> notesLeft,
        Func<T, string?> notesRight)
    {
        foreach (string key in left.Keys.Except(right.Keys, StringComparer.OrdinalIgnoreCase))

            result.Diffs.Add(new DiffItem
            {
                Section = section,
                Key = key,
                DiffKind = DiffKind.Removed,
                BeforeValue = primaryLeft(left[key]),
                Notes = notesLeft(left[key])
            });


        foreach (string key in right.Keys.Except(left.Keys, StringComparer.OrdinalIgnoreCase))

            result.Diffs.Add(new DiffItem
            {
                Section = section,
                Key = key,
                DiffKind = DiffKind.Added,
                AfterValue = primaryRight(right[key]),
                Notes = notesRight(right[key])
            });


        foreach (string key in left.Keys.Intersect(right.Keys, StringComparer.OrdinalIgnoreCase))
        {
            string? leftValue = primaryLeft(left[key]);
            string? rightValue = primaryRight(right[key]);
            string? leftNotes = notesLeft(left[key]);
            string? rightNotes = notesRight(right[key]);

            if (!string.Equals(leftValue, rightValue, StringComparison.OrdinalIgnoreCase) ||
                !string.Equals(leftNotes, rightNotes, StringComparison.Ordinal))

                result.Diffs.Add(new DiffItem
                {
                    Section = section,
                    Key = key,
                    DiffKind = DiffKind.Changed,
                    BeforeValue = leftValue,
                    AfterValue = rightValue,
                    Notes = $"Before: {leftNotes} | After: {rightNotes}"
                });
        }
    }

    private static void AddDiff(
        ManifestComparisonResult result,
        string section,
        string key,
        string? beforeValue,
        string? afterValue)
    {
        if (!string.Equals(beforeValue, afterValue, StringComparison.Ordinal))

            result.Diffs.Add(new DiffItem
            {
                Section = section,
                Key = key,
                DiffKind = DiffKind.Changed,
                BeforeValue = beforeValue,
                AfterValue = afterValue
            });
    }

    /// <summary>
    ///     Builds a case-insensitive dictionary from <paramref name="source" />, taking the first element
    ///     when duplicate keys are present. Prevents <see cref="ArgumentException" /> on bad persisted data.
    /// </summary>
    private static Dictionary<string, T> ToFirstWins<T>(
        IEnumerable<T> source,
        Func<T, string> keySelector)
    {
        return source
            .GroupBy(keySelector, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
    }
}
