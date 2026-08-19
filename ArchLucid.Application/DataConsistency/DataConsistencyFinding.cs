namespace ArchLucid.Application.DataConsistency;

public sealed record DataConsistencyFinding(
    string CheckName,
    DataConsistencyFindingSeverity Severity,
    string Description,
    IReadOnlyList<string> AffectedEntityIds);
