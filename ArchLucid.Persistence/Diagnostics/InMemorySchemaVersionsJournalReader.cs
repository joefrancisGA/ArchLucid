using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Persistence.Diagnostics;

/// <summary>In-memory storage has no DbUp journal — always Unknown-friendly empty snapshot.</summary>
public sealed class InMemorySchemaVersionsJournalReader : ISchemaVersionsJournalReader
{
    public Task<SchemaVersionsJournalSnapshot> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(new SchemaVersionsJournalSnapshot(
            TableMissing: true,
            AppliedCount: 0,
            LatestScriptName: null));
    }
}
