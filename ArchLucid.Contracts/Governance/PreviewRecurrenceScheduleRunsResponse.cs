using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Governance;

/// <summary>Server-authoritative preview of upcoming recurrence run instants (UTC).</summary>
public sealed class PreviewRecurrenceScheduleRunsResponse
{
    public bool IsValid { get; set; }

    public string? ValidationError { get; set; }

    private IReadOnlyList<DateTime> nextRunUtc = [];

    public IReadOnlyList<DateTime> NextRunUtc
    {
        get => nextRunUtc;
        set => nextRunUtc = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
