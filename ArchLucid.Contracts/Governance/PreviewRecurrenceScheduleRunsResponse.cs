namespace ArchLucid.Contracts.Governance;

/// <summary>Server-authoritative preview of upcoming recurrence run instants (UTC).</summary>
public sealed class PreviewRecurrenceScheduleRunsResponse
{
    public bool IsValid { get; set; }

    public string? ValidationError { get; set; }

    public IReadOnlyList<DateTime> NextRunUtc { get; set; } = Array.Empty<DateTime>();
}
