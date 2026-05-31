namespace ArchLucid.Contracts.Governance;

/// <summary>Creates a recurring follow-up architecture review from a committed source run (TB-059–062).</summary>
public sealed class CreateArchitectureReviewRecurrenceScheduleRequest
{
    public Guid SourceRunId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = "Recurring architecture review";

    public string CronExpression
    {
        get;
        init;
    } = "0 8 * * 1";

    public bool IsEnabled
    {
        get;
        init;
    } = true;
}
