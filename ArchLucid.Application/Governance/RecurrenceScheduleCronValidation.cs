namespace ArchLucid.Application.Governance;

/// <summary>Shared validation copy for recurrence schedule cron expressions.</summary>
public static class RecurrenceScheduleCronValidation
{
    public const string InvalidCronMessage =
        "Unsupported or invalid cron expression. Use @hourly, @daily, @weekly, or a valid five-field UTC cron such as 0 7 * * * or 0 8 * * 1.";
}
