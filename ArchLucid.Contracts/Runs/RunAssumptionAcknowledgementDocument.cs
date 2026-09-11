namespace ArchLucid.Contracts.Runs;

/// <summary>
///     Persisted operator acknowledgement of open assumptions for one review run before finalize (TB-2345 item 49).
///     Ids are the stable FNV-1a assumption ids shared by the UI and <c>FinalizeAssumptionGateEvaluator</c>.
/// </summary>
public sealed class RunAssumptionAcknowledgementDocument
{
    public const string DocumentVersion = "assumption-acknowledgement-v1";

    public string EvaluationVersion
    {
        get;
        set;
    } = DocumentVersion;

    public DateTime AcknowledgedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public string ActorUserId
    {
        get;
        set;
    } = string.Empty;

    public List<string> AcknowledgedAssumptionIds
    {
        get;
        set;
    } = [];
}
