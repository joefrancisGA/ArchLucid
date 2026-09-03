using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Alerts;

public sealed partial class DapperCompositeAlertRuleRepository
{
    public async Task<CompositeAlertRule?> GetByIdAsync(Guid compositeRuleId, CancellationToken ct)
    {
        const string sqlRule = """
            SELECT
                CompositeRuleId, TenantId, WorkspaceId, ProjectId,
                Name, Severity, [Operator] AS Operator, IsEnabled,
                SuppressionWindowMinutes, CooldownMinutes, ReopenDeltaThreshold,
                DedupeScope, TargetChannelType, CreatedUtc
            FROM dbo.CompositeAlertRules
            WHERE CompositeRuleId = @CompositeRuleId;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        CompositeAlertRule? rule = await connection.QueryFirstOrDefaultAsync<CompositeAlertRule>(
            new CommandDefinition(sqlRule, new
            {
                CompositeRuleId = compositeRuleId
            }, cancellationToken: ct));

        if (rule is null)
            return null;

        List<CompositeAlertRule> singleRule = [rule];
        await HydrateConditionsAsync(connection, singleRule, ct);
        return rule;
    }

    public async Task<IReadOnlyList<CompositeAlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        const string sql = """
            SELECT TOP 200
                CompositeRuleId, TenantId, WorkspaceId, ProjectId,
                Name, Severity, [Operator] AS Operator, IsEnabled,
                SuppressionWindowMinutes, CooldownMinutes, ReopenDeltaThreshold,
                DedupeScope, TargetChannelType, CreatedUtc
            FROM dbo.CompositeAlertRules
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY CreatedUtc DESC;
            """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        List<CompositeAlertRule> rules = (await connection.QueryAsync<CompositeAlertRule>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: ct)))
            .ToList();

        await HydrateConditionsAsync(connection, rules, ct);
        return rules;
    }

    public async Task<IReadOnlyList<CompositeAlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        return await ListByScopeFilteredAsync(tenantId, workspaceId, projectId, enabledOnly: true, ct)
            ;
    }

    private async Task<List<CompositeAlertRule>> ListByScopeFilteredAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        bool enabledOnly,
        CancellationToken ct)
    {
        string sql = """
                     SELECT TOP 200
                         CompositeRuleId, TenantId, WorkspaceId, ProjectId,
                         Name, Severity, [Operator] AS Operator, IsEnabled,
                         SuppressionWindowMinutes, CooldownMinutes, ReopenDeltaThreshold,
                         DedupeScope, TargetChannelType, CreatedUtc
                     FROM dbo.CompositeAlertRules
                     WHERE TenantId = @TenantId
                       AND WorkspaceId = @WorkspaceId
                       AND ProjectId = @ProjectId
                     """;

        if (enabledOnly)
            sql += " AND IsEnabled = 1";

        sql += " ORDER BY CreatedUtc DESC;";

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);
        List<CompositeAlertRule> rules = (await connection.QueryAsync<CompositeAlertRule>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: ct)))
            .ToList();

        await HydrateConditionsAsync(connection, rules, ct);
        return rules;
    }

    private static async Task HydrateConditionsAsync(
        SqlConnection connection,
        List<CompositeAlertRule> rules,
        CancellationToken ct)
    {
        if (rules.Count == 0)
            return;

        const string sql = """
            SELECT
                ConditionId, CompositeRuleId, MetricType, [Operator] AS Operator, ThresholdValue
            FROM dbo.CompositeAlertRuleConditions
            WHERE CompositeRuleId IN @Ids;
            """;

        Guid[] ids = rules.Select(r => r.CompositeRuleId).ToArray();
        List<ConditionRow> rows = (await connection
                .QueryAsync<ConditionRow>(
                    new CommandDefinition(sql, new
                    {
                        Ids = ids
                    }, cancellationToken: ct))
                )
            .ToList();

        Dictionary<Guid, IReadOnlyList<AlertRuleCondition>> byRule = rows
            .GroupBy(x => x.CompositeRuleId)
            .ToDictionary(
                g => g.Key,
                g => (IReadOnlyList<AlertRuleCondition>)g
                    .Select(
                        row => new AlertRuleCondition
                        {
                            ConditionId = row.ConditionId,
                            MetricType = row.MetricType,
                            Operator = row.Operator,
                            ThresholdValue = row.ThresholdValue,
                        })
                    .ToList());
        CompositeAlertRuleRepositoryCore.AttachConditions(rules, byRule);
    }

    private sealed class ConditionRow
    {
        public Guid ConditionId
        {
            get; init;
        }
        public Guid CompositeRuleId
        {
            get; init;
        }
        public string MetricType { get; init; } = null!;
        public string Operator { get; init; } = null!;
        public decimal ThresholdValue
        {
            get; init;
        }
    }
}
