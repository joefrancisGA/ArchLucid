namespace ArchLucid.Core.Diagnostics;

public sealed record SchemaVersionsJournalSnapshot(
    bool TableMissing,
    int AppliedCount,
    string? LatestScriptName);
