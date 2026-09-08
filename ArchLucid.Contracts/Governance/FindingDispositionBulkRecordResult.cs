namespace ArchLucid.Contracts.Governance;

/// <summary>Result from <see cref="ArchLucid.Persistence.Data.Repositories.IFindingDispositionConcurrencyRepository.RecordBulkAsync"/>.</summary>
public sealed class FindingDispositionBulkRecordResult
{
    public FindingDispositionRecordStatus Status
    {
        get;
        init;
    }

    public IReadOnlyList<byte[]>? NewCurrentRowVersions
    {
        get;
        init;
    }

    public FindingDispositionConflictDetail? Conflict
    {
        get;
        init;
    }
}
