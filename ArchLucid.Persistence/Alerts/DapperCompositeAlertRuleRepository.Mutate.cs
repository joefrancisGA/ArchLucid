using System.Data.Common;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Alerts;

public sealed partial class DapperCompositeAlertRuleRepository
{
    public async Task CreateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        const string insertRule = """
            INSERT INTO dbo.CompositeAlertRules
            (
                CompositeRuleId, TenantId, WorkspaceId, ProjectId,
                Name, Severity, [Operator], IsEnabled,
                SuppressionWindowMinutes, CooldownMinutes, ReopenDeltaThreshold,
                DedupeScope, TargetChannelType, CreatedUtc
            )
            VALUES
            (
                @CompositeRuleId, @TenantId, @WorkspaceId, @ProjectId,
                @Name, @Severity, @Operator, @IsEnabled,
                @SuppressionWindowMinutes, @CooldownMinutes, @ReopenDeltaThreshold,
                @DedupeScope, @TargetChannelType, @CreatedUtc
            );
            """;

        const string insertCondition = """
            INSERT INTO dbo.CompositeAlertRuleConditions
            (ConditionId, CompositeRuleId, MetricType, [Operator], ThresholdValue, TenantId, WorkspaceId, ProjectId)
            VALUES (@ConditionId, @CompositeRuleId, @MetricType, @Operator, @ThresholdValue, @TenantId, @WorkspaceId, @ProjectId);
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await using DbTransaction tx = await connection.BeginTransactionAsync(ct);
        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(insertRule, rule, transaction: tx, cancellationToken: ct));

            foreach (AlertRuleCondition c in rule.Conditions)

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertCondition,
                        new
                        {
                            c.ConditionId,
                            rule.CompositeRuleId,
                            c.MetricType,
                            c.Operator,
                            c.ThresholdValue,
                            rule.TenantId,
                            rule.WorkspaceId,
                            rule.ProjectId,
                        },
                        transaction: tx,
                        cancellationToken: ct));


            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task UpdateAsync(CompositeAlertRule rule, CancellationToken ct)
    {
        const string updateRule = """
            UPDATE dbo.CompositeAlertRules
            SET
                Name = @Name,
                Severity = @Severity,
                [Operator] = @Operator,
                IsEnabled = @IsEnabled,
                SuppressionWindowMinutes = @SuppressionWindowMinutes,
                CooldownMinutes = @CooldownMinutes,
                ReopenDeltaThreshold = @ReopenDeltaThreshold,
                DedupeScope = @DedupeScope,
                TargetChannelType = @TargetChannelType
            WHERE CompositeRuleId = @CompositeRuleId;
            """;

        const string deleteConditions = """
            DELETE FROM dbo.CompositeAlertRuleConditions
            WHERE CompositeRuleId = @CompositeRuleId;
            """;

        const string insertCondition = """
            INSERT INTO dbo.CompositeAlertRuleConditions
            (ConditionId, CompositeRuleId, MetricType, [Operator], ThresholdValue, TenantId, WorkspaceId, ProjectId)
            VALUES (@ConditionId, @CompositeRuleId, @MetricType, @Operator, @ThresholdValue, @TenantId, @WorkspaceId, @ProjectId);
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        await using DbTransaction tx = await connection.BeginTransactionAsync(ct);
        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(updateRule, rule, transaction: tx, cancellationToken: ct));
            await connection.ExecuteAsync(
                new CommandDefinition(
                    deleteConditions,
                    new
                    {
                        rule.CompositeRuleId
                    },
                    transaction: tx,
                    cancellationToken: ct));

            foreach (AlertRuleCondition c in rule.Conditions)

                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertCondition,
                        new
                        {
                            c.ConditionId,
                            rule.CompositeRuleId,
                            c.MetricType,
                            c.Operator,
                            c.ThresholdValue,
                            rule.TenantId,
                            rule.WorkspaceId,
                            rule.ProjectId,
                        },
                        transaction: tx,
                        cancellationToken: ct));


            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
