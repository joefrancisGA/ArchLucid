using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RecurrenceScheduleValidationTests
{
    [Fact]
    public void ValidateNameOrThrow_accepts_name_at_sql_limit()
    {
        string name = new('n', RecurrenceScheduleValidation.NameMaxLength);

        Action act = () => RecurrenceScheduleValidation.ValidateNameOrThrow(name);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateNameOrThrow_rejects_name_longer_than_sql_column()
    {
        string name = new('n', RecurrenceScheduleValidation.NameMaxLength + 1);

        Action act = () => RecurrenceScheduleValidation.ValidateNameOrThrow(name);

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("name")
            .WithMessage($"*at most {RecurrenceScheduleValidation.NameMaxLength}*");
    }

    [Fact]
    public void ValidateCronExpressionLengthOrThrow_accepts_cron_at_sql_limit()
    {
        string cron = new('0', RecurrenceScheduleValidation.CronExpressionMaxLength);

        Action act = () => RecurrenceScheduleValidation.ValidateCronExpressionLengthOrThrow(cron);

        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateCronExpressionLengthOrThrow_rejects_cron_longer_than_sql_column()
    {
        string cron = new('0', RecurrenceScheduleValidation.CronExpressionMaxLength + 1);

        Action act = () => RecurrenceScheduleValidation.ValidateCronExpressionLengthOrThrow(cron);

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("cronExpression")
            .WithMessage($"*at most {RecurrenceScheduleValidation.CronExpressionMaxLength}*");
    }

    [Fact]
    public void ValidateCommittedSourceRunOrThrow_rejects_ready_for_commit_run()
    {
        RunRecord run = new()
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit),
        };

        Action act = () => RecurrenceScheduleValidation.ValidateCommittedSourceRunOrThrow(run);

        act.Should()
            .Throw<ArgumentException>()
            .WithParameterName("sourceRun")
            .WithMessage("*committed*");
    }

    [Fact]
    public void ValidateCommittedSourceRunOrThrow_accepts_committed_run()
    {
        RunRecord run = new()
        {
            LegacyRunStatus = nameof(ArchitectureRunStatus.Committed),
        };

        Action act = () => RecurrenceScheduleValidation.ValidateCommittedSourceRunOrThrow(run);

        act.Should().NotThrow();
    }
}
