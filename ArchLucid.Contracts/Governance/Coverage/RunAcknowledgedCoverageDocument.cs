using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Persisted operator acknowledgement of assurance coverage for one run prior to execute.</summary>
public sealed class RunAcknowledgedCoverageDocument
{
    public const string DocumentVersion = "acknowledged-coverage-v1";

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

    private List<RunCoverageAcknowledgementEntry> entries = [];

    public List<RunCoverageAcknowledgementEntry> Entries
    {
        get => entries;
        set => entries = ContractCollectionDefaults.Coalesce(value);
    }
}
