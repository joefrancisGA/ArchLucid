namespace ArchLucid.Contracts.Governance;

/// <summary>POST body for <c>/v1/governance/mutation-corrections</c>.</summary>
public sealed class RecordGovernanceMutationCorrectionRequest
{
    /// <summary>Registry mutation id (e.g. <c>governance_quick_approve</c>).</summary>
    public string MutationKind
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Approval request id, promotion record id, or activation id being corrected.</summary>
    public string SubjectId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Run id for tenant scope validation and audit anchoring.</summary>
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Operator rationale explaining the correction.</summary>
    public string Rationale
    {
        get;
        init;
    } = string.Empty;
}
