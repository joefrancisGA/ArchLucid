using ArchLucid.Core.Persistence.DecisionTraces;

namespace ArchLucid.Persistence.Repositories;

public static partial class DecisionTraceRepositoryCore
{
    public const int MaxInMemoryEntries = DecisionTraceStoreRules.MaxInMemoryEntries;

    public static void TrimInMemoryEntries<T>(List<T> entries) =>
        DecisionTraceStoreRules.TrimInMemoryEntries(entries);
}
