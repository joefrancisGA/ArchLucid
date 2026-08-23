namespace ArchLucid.Persistence.IntegrationOutbox;

/// <summary>
///     Named Dapper statements for <c>dbo.IntegrationEventOutbox</c>. Kept out of method bodies so enqueue,
///     dequeue, and dead-letter SQL can be reviewed without scrolling through repository orchestration.
/// </summary>
internal static class IntegrationEventOutboxSql
{
    public const string Enqueue = """
                                  INSERT INTO dbo.IntegrationEventOutbox
                                  (OutboxId, RunId, EventType, MessageId, PayloadUtf8, TenantId, WorkspaceId, ProjectId, Priority, CreatedUtc)
                                  VALUES (@OutboxId, @RunId, @EventType, @MessageId, @PayloadUtf8, @TenantId, @WorkspaceId, @ProjectId, @Priority, SYSUTCDATETIME());
                                  """;

    public const string DequeuePending = """
                                         SELECT TOP (@Take)
                                             OutboxId, RunId, EventType, MessageId, PayloadUtf8, TenantId, WorkspaceId, ProjectId, CreatedUtc,
                                             Priority,
                                             RetryCount, NextRetryUtc, LastErrorMessage, DeadLetteredUtc
                                         FROM dbo.IntegrationEventOutbox
                                         WHERE ProcessedUtc IS NULL
                                           AND DeadLetteredUtc IS NULL
                                           AND (NextRetryUtc IS NULL OR NextRetryUtc <= SYSUTCDATETIME())
                                         ORDER BY ISNULL(Priority, 1) ASC, CreatedUtc ASC;
                                         """;

    public const string MarkProcessed = """
                                        UPDATE dbo.IntegrationEventOutbox
                                        SET ProcessedUtc = SYSUTCDATETIME()
                                        WHERE OutboxId = @OutboxId;
                                        """;

    public const string RecordPublishFailure = """
                                               UPDATE dbo.IntegrationEventOutbox
                                               SET RetryCount = @NewRetryCount,
                                                   NextRetryUtc = @NextRetryUtc,
                                                   DeadLetteredUtc = @DeadLetteredUtc,
                                                   LastErrorMessage = @LastErrorMessage
                                               WHERE OutboxId = @OutboxId;
                                               """;

    public const string CountPublishPending = """
                                              SELECT COUNT_BIG(1)
                                              FROM dbo.IntegrationEventOutbox
                                              WHERE ProcessedUtc IS NULL
                                                AND DeadLetteredUtc IS NULL;
                                              """;

    public const string CountDeadLetter = """
                                          SELECT COUNT_BIG(1)
                                          FROM dbo.IntegrationEventOutbox
                                          WHERE DeadLetteredUtc IS NOT NULL
                                            AND ProcessedUtc IS NULL;
                                          """;

    public const string ListDeadLetters = """
                                          SELECT TOP (@Take)
                                              OutboxId, RunId, TenantId, EventType, DeadLetteredUtc, RetryCount, LastErrorMessage
                                          FROM dbo.IntegrationEventOutbox
                                          WHERE DeadLetteredUtc IS NOT NULL
                                            AND ProcessedUtc IS NULL
                                            AND (@TenantId IS NULL OR TenantId = @TenantId)
                                          ORDER BY DeadLetteredUtc DESC;
                                          """;

    public const string ResetDeadLetterForRetry = """
                                                  UPDATE dbo.IntegrationEventOutbox
                                                  SET DeadLetteredUtc = NULL,
                                                      RetryCount = 0,
                                                      NextRetryUtc = NULL,
                                                      LastErrorMessage = NULL
                                                  WHERE OutboxId = @OutboxId
                                                    AND DeadLetteredUtc IS NOT NULL
                                                    AND (@TenantId IS NULL OR TenantId = @TenantId);
                                                  """;

    public const string AcknowledgeDeadLetter = """
                                                UPDATE dbo.IntegrationEventOutbox
                                                SET ProcessedUtc = SYSUTCDATETIME()
                                                WHERE OutboxId = @OutboxId
                                                  AND DeadLetteredUtc IS NOT NULL
                                                  AND ProcessedUtc IS NULL
                                                  AND (@TenantId IS NULL OR TenantId = @TenantId);
                                                """;

    public const string SelectMatchingDeadLetterIds = """
                                                      SELECT TOP (@Take) OutboxId
                                                      FROM dbo.IntegrationEventOutbox
                                                      WHERE DeadLetteredUtc IS NOT NULL
                                                        AND ProcessedUtc IS NULL
                                                        AND (@TenantId IS NULL OR TenantId = @TenantId)
                                                        AND (@EventType IS NULL OR EventType = @EventType)
                                                      ORDER BY DeadLetteredUtc DESC;
                                                      """;

    public const string BulkResetDeadLetters = """
                                               UPDATE dbo.IntegrationEventOutbox
                                               SET DeadLetteredUtc = NULL,
                                                   RetryCount = 0,
                                                   NextRetryUtc = NULL,
                                                   LastErrorMessage = NULL
                                               OUTPUT INSERTED.OutboxId
                                               WHERE OutboxId IN @OutboxIds
                                                 AND DeadLetteredUtc IS NOT NULL;
                                               """;

    public const string TryGetDeadLetterEntry = """
                                                SELECT OutboxId, RunId, EventType, MessageId, PayloadUtf8, TenantId, WorkspaceId, ProjectId,
                                                       CreatedUtc, Priority, RetryCount, NextRetryUtc, LastErrorMessage, DeadLetteredUtc
                                                FROM dbo.IntegrationEventOutbox
                                                WHERE OutboxId = @OutboxId
                                                  AND DeadLetteredUtc IS NOT NULL
                                                  AND ProcessedUtc IS NULL
                                                  AND (@TenantId IS NULL OR TenantId = @TenantId);
                                                """;
}
