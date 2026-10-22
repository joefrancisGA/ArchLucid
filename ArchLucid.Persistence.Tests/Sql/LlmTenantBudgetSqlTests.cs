using ArchLucid.Persistence.Sql;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     Guards extracted LLM tenant budget SQL for tenant scoping, optimistic concurrency, and hard-cap predicates.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmTenantBudgetSqlTests
{
    public static TheoryData<string> DailyReserveAndSettleStatements =>
        new()
        {
            LlmTenantBudgetSql.ReserveDaily,
            LlmTenantBudgetSql.SettleDaily,
        };

    public static TheoryData<string> MonthlyReserveAndSettleStatements =>
        new()
        {
            LlmTenantBudgetSql.ReserveMonthly,
            LlmTenantBudgetSql.SettleMonthly,
        };

    public static TheoryData<string> DailySelectStatements =>
        new()
        {
            LlmTenantBudgetSql.SelectDaily,
            LlmTenantBudgetSql.SelectJudgeDaily,
        };

    [Theory]
    [MemberData(nameof(DailyReserveAndSettleStatements))]
    public void Daily_mutations_scope_by_tenant_and_utc_day_and_row_version(string sql)
    {
        sql.Should().Contain("WHERE TenantId = @TenantId");
        sql.Should().Contain("UtcDay = @UtcDay");
        sql.Should().Contain("RowVersion = @RowVersion");
        sql.Should().EndWith(";");
    }

    [Fact]
    public void Daily_reserve_enforces_hard_cap_before_increment()
    {
        LlmTenantBudgetSql.ReserveDaily.Should().Contain("TotalTokens + ReservedAssumedTokens + @Add <= @HardCap");
    }

    [Fact]
    public void Daily_settle_outputs_warn_transition_columns()
    {
        string sql = LlmTenantBudgetSql.SettleDaily;

        sql.Should().Contain("OUTPUT INSERTED.TotalTokens AS NewTotal");
        sql.Should().Contain("DELETED.TotalTokens AS OldTotal");
        sql.Should().Contain("ReservedAssumedTokens >= @Release");
        sql.Should().Contain("WarnedApproaching = CASE");
    }

    [Theory]
    [MemberData(nameof(MonthlyReserveAndSettleStatements))]
    public void Monthly_mutations_scope_by_tenant_year_month_and_row_version(string sql)
    {
        sql.Should().Contain("WHERE TenantId = @TenantId");
        sql.Should().Contain("UtcYear = @UtcYear");
        sql.Should().Contain("UtcMonth = @UtcMonth");
        sql.Should().Contain("RowVersion = @RowVersion");
        sql.Should().EndWith(";");
    }

    [Fact]
    public void Monthly_reserve_enforces_hard_cap_before_increment()
    {
        LlmTenantBudgetSql.ReserveMonthly.Should().Contain("SpentUsd + ReservedAssumedUsd + @Add <= @HardCap");
    }

    [Theory]
    [MemberData(nameof(DailySelectStatements))]
    public void Daily_reads_project_token_columns_and_scope_by_tenant_day(string sql)
    {
        sql.Should().Contain("TotalTokens AS TokensConsumed");
        sql.Should().Contain("ReservedAssumedTokens AS ReservedTokens");
        sql.Should().Contain("WHERE TenantId = @TenantId AND UtcDay = @UtcDay");
        sql.Should().EndWith(";");
    }

    [Fact]
    public void Monthly_select_projects_usd_columns()
    {
        string sql = LlmTenantBudgetSql.SelectMonthly;

        sql.Should().Contain("SpentUsd AS CommittedUsd");
        sql.Should().Contain("ReservedAssumedUsd AS ReservedUsd");
        sql.Should().Contain("PurchasedCapBumpUsd AS PurchasedCapBumpUsd");
        sql.Should().Contain("WHERE TenantId = @TenantId AND UtcYear = @UtcYear AND UtcMonth = @UtcMonth");
    }

    [Fact]
    public void Judge_daily_reserve_targets_judge_window_table()
    {
        LlmTenantBudgetSql.ReserveJudgeDaily.Should().Contain("dbo.LlmJudgeDailyTenantTokenWindowState");
    }

    [Fact]
    public void Insert_statements_seed_zero_counters()
    {
        LlmTenantBudgetSql.InsertDaily.Should().Contain("VALUES (@TenantId, @UtcDay, 0, 0, 0, SYSUTCDATETIME())");
        LlmTenantBudgetSql.InsertMonthly.Should().Contain("VALUES (@TenantId, @UtcYear, @UtcMonth, 0, 0, 0, 0, SYSUTCDATETIME())");
        LlmTenantBudgetSql.InsertJudgeDaily.Should().Contain("VALUES (@TenantId, @UtcDay, 0, 0, 0, SYSUTCDATETIME())");
    }

    [Fact]
    public void Select_sql_utc_year_month_uses_server_clock()
    {
        LlmTenantBudgetSql.SelectSqlUtcYearMonth.Should().Be(
            "SELECT YEAR(SYSUTCDATETIME()) AS UtcYear, MONTH(SYSUTCDATETIME()) AS UtcMonth;");
    }
}
