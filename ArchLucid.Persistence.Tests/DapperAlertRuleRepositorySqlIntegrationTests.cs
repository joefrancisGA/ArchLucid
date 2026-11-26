using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tests.Support;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Connections;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="DapperAlertRuleRepository" /> against real SQL Server (Docker) + production-shaped DDL from DbUp.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class DapperAlertRuleRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Create_Get_Update_ListByScope_round_trips_on_sql_server()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperAlertRuleRepository repository = new(factory);

        ScopeContext scope = IsolatedPersistenceTestScope.New();
        Guid tenantId = scope.TenantId;
        Guid workspaceId = scope.WorkspaceId;
        Guid projectId = scope.ProjectId;
        Guid ruleId = Guid.NewGuid();

        AlertRule rule = new()
        {
            RuleId = ruleId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = "SQL integration rule",
            RuleType = "TestMetric",
            Severity = AlertSeverity.Warning,
            ThresholdValue = 42.5m,
            IsEnabled = true,
            TargetChannelType = "DigestOnly",
            MetadataJson = """{"k":"v"}""",
            CreatedUtc = new DateTime(2026, 3, 27, 11, 0, 0, DateTimeKind.Utc)
        };

        await repository.CreateAsync(rule, CancellationToken.None);

        AlertRule? loaded = await repository.GetByIdAsync(scope, ruleId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded.Name.Should().Be("SQL integration rule");
        loaded.ThresholdValue.Should().Be(42.5m);

        rule.Name = "SQL integration rule (updated)";
        await repository.UpdateAsync(rule, CancellationToken.None);

        AlertRule? afterUpdate = await repository.GetByIdAsync(scope, ruleId, CancellationToken.None);
        afterUpdate.Should().NotBeNull();
        afterUpdate.Name.Should().Be("SQL integration rule (updated)");

        IReadOnlyList<AlertRule> list = await repository.ListByScopeAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        list.Should().ContainSingle(r => r.RuleId == ruleId);

        IReadOnlyList<AlertRule> enabled = await repository.ListEnabledByScopeAsync(
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        enabled.Should().Contain(r => r.RuleId == ruleId);
    }
}
