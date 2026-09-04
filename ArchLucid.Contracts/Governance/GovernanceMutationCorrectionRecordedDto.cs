namespace ArchLucid.Contracts.Governance;

/// <summary>Response after recording a governance mutation correction on the audit trail.</summary>
public sealed class GovernanceMutationCorrectionRecordedDto
{
    public string CorrectionId
    {
        get;
        init;
    } = string.Empty;

    public string MutationKind
    {
        get;
        init;
    } = string.Empty;

    public string SubjectId
    {
        get;
        init;
    } = string.Empty;

    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset RecordedAtUtc
    {
        get;
        init;
    }

    public string RecordedByUserId
    {
        get;
        init;
    } = string.Empty;
}
