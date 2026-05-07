namespace ArchLucid.Application.DataConsistency;
public sealed record DataConsistencyFinding(string CheckName, DataConsistencyFindingSeverity Severity, string Description, IReadOnlyList<string> AffectedEntityIds)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(CheckName, Description, AffectedEntityIds);
    private static byte __ValidatePrimaryConstructorArguments(System.String checkName, System.String description, System.Collections.Generic.IReadOnlyList<System.String> affectedEntityIds)
    {
        ArgumentNullException.ThrowIfNull(checkName);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentNullException.ThrowIfNull(affectedEntityIds);
        return (byte)0;
    }
}