namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Body for <c>POST /v1/findings/{findingId}/mute</c>. <see cref="RunId" /> scopes the relational update to one
///     authority run (findings snapshot FK).
/// </summary>
public sealed class FindingMuteRequest
{
    /// <summary>Authority run that owns the findings snapshot row to update.</summary>
    public Guid RunId
    {
        get;
        init;
    }

    /// <summary>Operator justification; persisted to <c>dbo.FindingRecords.MuteReason</c>.</summary>
    public string Reason
    {
        get;
        init;
    } = string.Empty;
}
