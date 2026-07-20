namespace ArchLucid.Core.Diagnostics;

/// <summary>Reads DbUp <c>dbo.SchemaVersions</c> journal summary without exposing connection details.</summary>
public interface ISchemaVersionsJournalReader
{
    Task<SchemaVersionsJournalSnapshot> GetSnapshotAsync(CancellationToken cancellationToken);
}
