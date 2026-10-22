using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance;

/// <summary>Validates recurrence schedule fields before <c>dbo.ArchitectureReviewRecurrenceSchedules</c> persistence.</summary>
public static class RecurrenceScheduleValidation
{
    public const int NameMaxLength = 300;

    public const int CronExpressionMaxLength = 100;

    public static void ValidateNameOrThrow(string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        string trimmedName = name.Trim();

        if (trimmedName.Length > NameMaxLength)
        {
            throw new ArgumentException(
                $"Schedule name must be at most {NameMaxLength} characters.",
                nameof(name));
        }
    }

    public static void ValidateCronExpressionLengthOrThrow(string cronExpression)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(cronExpression);

        string trimmedCron = cronExpression.Trim();

        if (trimmedCron.Length > CronExpressionMaxLength)
        {
            throw new ArgumentException(
                $"Cron expression must be at most {CronExpressionMaxLength} characters.",
                nameof(cronExpression));
        }
    }

    public static void ValidateCommittedSourceRunOrThrow(RunRecord sourceRun)
    {
        ArgumentNullException.ThrowIfNull(sourceRun);

        if (!string.Equals(sourceRun.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.Ordinal))
        {
            throw new ArgumentException(
                "Source run must be committed before it can seed a recurring architecture review schedule.",
                nameof(sourceRun));
        }
    }
}
