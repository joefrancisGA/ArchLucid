namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
    public const int MaxInMemoryEntries = 500;

    public static void TrimInMemoryEntries<T>(List<T> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count > MaxInMemoryEntries)
            entries.RemoveRange(0, entries.Count - MaxInMemoryEntries);
    }
}
