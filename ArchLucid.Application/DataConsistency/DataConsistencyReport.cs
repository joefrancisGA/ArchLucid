namespace ArchLucid.Application.DataConsistency;
public sealed record DataConsistencyReport(DateTime CheckedAtUtc, IReadOnlyList<DataConsistencyFinding> Findings, bool IsHealthy)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(Findings);
    private static byte __ValidatePrimaryConstructorArguments(System.Collections.Generic.IReadOnlyList<ArchLucid.Application.DataConsistency.DataConsistencyFinding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);
        return (byte)0;
    }
}