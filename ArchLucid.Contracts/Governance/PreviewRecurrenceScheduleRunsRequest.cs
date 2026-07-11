namespace ArchLucid.Contracts.Governance;

/// <summary>Preview upcoming recurrence run instants using server cron semantics.</summary>
public sealed class PreviewRecurrenceScheduleRunsRequest
{
    public string CronExpression { get; set; } = string.Empty;

    public int Count { get; set; } = 5;

    public DateTime? FromUtc { get; set; }
}
