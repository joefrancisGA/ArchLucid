namespace ArchLucid.Contracts.Governance;

/// <summary>Outcome of a disposition record attempt with current-pointer CAS.</summary>
public enum FindingDispositionRecordStatus
{
    Recorded = 0,
    Conflict = 1,
}

/// <summary>Result from <see cref="IFindingDispositionConcurrencyRepository.RecordAsync"/>.</summary>
public sealed class FindingDispositionRecordResult
{
    public FindingDispositionRecordStatus Status
    {
        get;
        init;
    }

    public byte[]? NewCurrentRowVersion
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
