namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Command SQL for <c>SqlLlmTenantBudgetRepository</c> (daily, judge-daily, and monthly token/USD budgets).
/// </summary>
internal static class LlmTenantBudgetSql
{
    public const string InsertDaily = """
                                      INSERT INTO dbo.LlmDailyTenantTokenWindowState (TenantId, UtcDay, TotalTokens, ReservedAssumedTokens, WarnedApproaching, LastUpdatedUtc)
                                      VALUES (@TenantId, @UtcDay, 0, 0, 0, SYSUTCDATETIME());
                                      """;

    public const string InsertMonthly = """
                                        INSERT INTO dbo.LlmMonthlyTenantBudgetState (TenantId, UtcYear, UtcMonth, SpentUsd, ReservedAssumedUsd, PurchasedCapBumpUsd, WarnedApproaching, LastUpdatedUtc)
                                        VALUES (@TenantId, @UtcYear, @UtcMonth, 0, 0, 0, 0, SYSUTCDATETIME());
                                        """;

    public const string ReserveDaily = """
                                       UPDATE dbo.LlmDailyTenantTokenWindowState
                                       SET ReservedAssumedTokens = ReservedAssumedTokens + @Add,
                                           LastUpdatedUtc = SYSUTCDATETIME()
                                       WHERE TenantId = @TenantId
                                         AND UtcDay = @UtcDay
                                         AND RowVersion = @RowVersion
                                         AND TotalTokens + ReservedAssumedTokens + @Add <= @HardCap;
                                       """;

    public const string ReserveMonthly = """
                                         UPDATE dbo.LlmMonthlyTenantBudgetState
                                         SET ReservedAssumedUsd = ReservedAssumedUsd + @Add,
                                             LastUpdatedUtc = SYSUTCDATETIME()
                                         WHERE TenantId = @TenantId
                                           AND UtcYear = @UtcYear
                                           AND UtcMonth = @UtcMonth
                                           AND RowVersion = @RowVersion
                                           AND SpentUsd + ReservedAssumedUsd + @Add <= @HardCap;
                                         """;

    public const string SettleDaily = """
                                      UPDATE dbo.LlmDailyTenantTokenWindowState
                                      SET TotalTokens = TotalTokens + @Actual,
                                          ReservedAssumedTokens = ReservedAssumedTokens - @Release,
                                          WarnedApproaching = CASE
                                              WHEN WarnedApproaching = 1 THEN 1
                                              WHEN TotalTokens < @WarnAt AND TotalTokens + @Actual >= @WarnAt THEN 1
                                              ELSE WarnedApproaching
                                              END,
                                          LastUpdatedUtc = SYSUTCDATETIME()
                                      OUTPUT INSERTED.TotalTokens AS NewTotal,
                                             INSERTED.WarnedApproaching AS NewWarned,
                                             DELETED.TotalTokens AS OldTotal,
                                             DELETED.WarnedApproaching AS OldWarned
                                      WHERE TenantId = @TenantId
                                        AND UtcDay = @UtcDay
                                        AND RowVersion = @RowVersion
                                        AND ReservedAssumedTokens >= @Release;
                                      """;

    public const string SettleMonthly = """
                                        UPDATE dbo.LlmMonthlyTenantBudgetState
                                        SET SpentUsd = SpentUsd + @Actual,
                                            ReservedAssumedUsd = ReservedAssumedUsd - @Release,
                                            WarnedApproaching = CASE
                                                WHEN WarnedApproaching = 1 THEN 1
                                                WHEN SpentUsd < @WarnAt AND SpentUsd + @Actual >= @WarnAt THEN 1
                                                ELSE WarnedApproaching
                                                END,
                                            LastUpdatedUtc = SYSUTCDATETIME()
                                        OUTPUT INSERTED.SpentUsd AS NewSpent,
                                               INSERTED.WarnedApproaching AS NewWarned,
                                               DELETED.SpentUsd AS OldSpent,
                                               DELETED.WarnedApproaching AS OldWarned
                                        WHERE TenantId = @TenantId
                                          AND UtcYear = @UtcYear
                                          AND UtcMonth = @UtcMonth
                                          AND RowVersion = @RowVersion
                                          AND ReservedAssumedUsd >= @Release;
                                        """;

    public const string SelectDaily = """
                                      SELECT TotalTokens AS TokensConsumed,
                                             ReservedAssumedTokens AS ReservedTokens,
                                             CAST(0 AS DECIMAL(18, 6)) AS CommittedUsd,
                                             CAST(0 AS DECIMAL(18, 6)) AS ReservedUsd,
                                             CAST(0 AS DECIMAL(18, 6)) AS PurchasedCapBumpUsd,
                                             WarnedApproaching,
                                             RowVersion
                                      FROM dbo.LlmDailyTenantTokenWindowState
                                      WHERE TenantId = @TenantId AND UtcDay = @UtcDay;
                                      """;

    public const string SelectMonthly = """
                                        SELECT CAST(0 AS BIGINT) AS TokensConsumed,
                                               CAST(0 AS BIGINT) AS ReservedTokens,
                                               SpentUsd AS CommittedUsd,
                                               ReservedAssumedUsd AS ReservedUsd,
                                               PurchasedCapBumpUsd AS PurchasedCapBumpUsd,
                                               WarnedApproaching,
                                               RowVersion
                                        FROM dbo.LlmMonthlyTenantBudgetState
                                        WHERE TenantId = @TenantId AND UtcYear = @UtcYear AND UtcMonth = @UtcMonth;
                                        """;

    public const string SelectSqlUtcYearMonth =
        "SELECT YEAR(SYSUTCDATETIME()) AS UtcYear, MONTH(SYSUTCDATETIME()) AS UtcMonth;";

    public const string InsertJudgeDaily = """
                                           INSERT INTO dbo.LlmJudgeDailyTenantTokenWindowState (TenantId, UtcDay, TotalTokens, ReservedAssumedTokens, WarnedApproaching, LastUpdatedUtc)
                                           VALUES (@TenantId, @UtcDay, 0, 0, 0, SYSUTCDATETIME());
                                           """;

    public const string ReserveJudgeDaily = """
                                            UPDATE dbo.LlmJudgeDailyTenantTokenWindowState
                                            SET ReservedAssumedTokens = ReservedAssumedTokens + @Add,
                                                LastUpdatedUtc = SYSUTCDATETIME()
                                            WHERE TenantId = @TenantId
                                              AND UtcDay = @UtcDay
                                              AND RowVersion = @RowVersion
                                              AND TotalTokens + ReservedAssumedTokens + @Add <= @HardCap;
                                            """;

    public const string SettleJudgeDaily = """
                                           UPDATE dbo.LlmJudgeDailyTenantTokenWindowState
                                           SET TotalTokens = TotalTokens + @Actual,
                                               ReservedAssumedTokens = ReservedAssumedTokens - @Release,
                                               LastUpdatedUtc = SYSUTCDATETIME()
                                           WHERE TenantId = @TenantId
                                             AND UtcDay = @UtcDay
                                             AND RowVersion = @RowVersion
                                             AND ReservedAssumedTokens >= @Release;
                                           """;

    public const string SelectJudgeDaily = """
                                           SELECT TotalTokens AS TokensConsumed,
                                                  ReservedAssumedTokens AS ReservedTokens,
                                                  CAST(0 AS DECIMAL(18, 6)) AS CommittedUsd,
                                                  CAST(0 AS DECIMAL(18, 6)) AS ReservedUsd,
                                                  CAST(0 AS DECIMAL(18, 6)) AS PurchasedCapBumpUsd,
                                                  WarnedApproaching,
                                                  RowVersion
                                           FROM dbo.LlmJudgeDailyTenantTokenWindowState
                                           WHERE TenantId = @TenantId AND UtcDay = @UtcDay;
                                           """;
}
