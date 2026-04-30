namespace ArchLucid.Application.DataConsistency;

public sealed record DataConsistencyReport(
    DateTime CheckedAtUtc,
    IReadOnlyList<DataConsistencyFinding> Findings,
    bool IsHealthy);
