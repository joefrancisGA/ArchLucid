using System.Data;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class SqlFindingDispositionConcurrencyRepository(ISqlConnectionFactory connectionFactory)
    : IFindingDispositionConcurrencyRepository
{
    public async Task<FindingDispositionRecordResult> RecordAsync(
        FindingReviewEventRecord reviewEvent,
        byte[]? expectedCurrentRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction transaction = (SqlTransaction)await connection.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);

        CurrentPointerRow? currentPointer = await connection.QuerySingleOrDefaultAsync<CurrentPointerRow>(
            new CommandDefinition(
                """
                SELECT c.CurrentEventId, c.RowVersionStamp
                FROM dbo.FindingCurrentDispositions AS c WITH (UPDLOCK, ROWLOCK)
                WHERE c.TenantId = @TenantId
                  AND c.WorkspaceId = @WorkspaceId
                  AND c.ProjectId = @ProjectId
                  AND c.FindingId = @FindingId;
                """,
                new
                {
                    reviewEvent.TenantId,
                    reviewEvent.WorkspaceId,
                    reviewEvent.ProjectId,
                    FindingId = reviewEvent.FindingId.Trim(),
                },
                transaction,
                cancellationToken: cancellationToken));

        if (currentPointer is not null)
        {
            if (expectedCurrentRowVersion is null || expectedCurrentRowVersion.Length == 0)
            {
                FindingDispositionConflictDetail conflict =
                    await LoadConflictDetailAsync(connection, transaction, currentPointer.CurrentEventId, cancellationToken);

                return BuildConflictResult(conflict);
            }

            if (!currentPointer.RowVersionStamp.AsSpan().SequenceEqual(expectedCurrentRowVersion))
            {
                FindingDispositionConflictDetail conflict =
                    await LoadConflictDetailAsync(connection, transaction, currentPointer.CurrentEventId, cancellationToken);

                return BuildConflictResult(conflict);
            }
        }
        else if (expectedCurrentRowVersion is not null && expectedCurrentRowVersion.Length > 0)
        {
            return BuildConflictResult(
                new FindingDispositionConflictDetail
                {
                    FindingId = reviewEvent.FindingId,
                    Disposition = reviewEvent.Disposition ?? FindingDisposition.Accepted,
                    ReviewerUserId = string.Empty,
                    OccurredAtUtc = DateTimeOffset.MinValue,
                    CurrentDispositionRowVersionBase64 = string.Empty,
                });
        }

        await AppendEventAsync(connection, transaction, reviewEvent, cancellationToken);

        byte[] newRowVersion;

        if (currentPointer is null)
        {
            try
            {
                newRowVersion = await connection.QuerySingleAsync<byte[]>(
                    new CommandDefinition(
                        """
                        INSERT INTO dbo.FindingCurrentDispositions
                            (TenantId, WorkspaceId, ProjectId, FindingId, CurrentEventId)
                        OUTPUT inserted.RowVersionStamp
                        VALUES
                            (@TenantId, @WorkspaceId, @ProjectId, @FindingId, @CurrentEventId);
                        """,
                        new
                        {
                            reviewEvent.TenantId,
                            reviewEvent.WorkspaceId,
                            reviewEvent.ProjectId,
                            FindingId = reviewEvent.FindingId.Trim(),
                            CurrentEventId = reviewEvent.EventId,
                        },
                        transaction,
                        cancellationToken: cancellationToken));
            }
            catch (SqlException ex) when (ex.Number is 2627 or 2601)
            {
                CurrentPointerRow racedPointer = await connection.QuerySingleAsync<CurrentPointerRow>(
                    new CommandDefinition(
                        """
                        SELECT c.CurrentEventId, c.RowVersionStamp
                        FROM dbo.FindingCurrentDispositions AS c WITH (UPDLOCK, ROWLOCK)
                        WHERE c.TenantId = @TenantId
                          AND c.WorkspaceId = @WorkspaceId
                          AND c.ProjectId = @ProjectId
                          AND c.FindingId = @FindingId;
                        """,
                        new
                        {
                            reviewEvent.TenantId,
                            reviewEvent.WorkspaceId,
                            reviewEvent.ProjectId,
                            FindingId = reviewEvent.FindingId.Trim(),
                        },
                        transaction,
                        cancellationToken: cancellationToken));

                FindingDispositionConflictDetail conflict =
                    await LoadConflictDetailAsync(connection, transaction, racedPointer.CurrentEventId, cancellationToken);

                await transaction.RollbackAsync(cancellationToken);

                return BuildConflictResult(conflict);
            }
        }
        else
        {
            int affected = await connection.QuerySingleAsync<int>(
                new CommandDefinition(
                    """
                    UPDATE dbo.FindingCurrentDispositions
                    SET CurrentEventId = @CurrentEventId
                    WHERE TenantId = @TenantId
                      AND WorkspaceId = @WorkspaceId
                      AND ProjectId = @ProjectId
                      AND FindingId = @FindingId
                      AND RowVersionStamp = @ExpectedRowVersion;
                    SELECT @@ROWCOUNT;
                    """,
                    new
                    {
                        reviewEvent.TenantId,
                        reviewEvent.WorkspaceId,
                        reviewEvent.ProjectId,
                        FindingId = reviewEvent.FindingId.Trim(),
                        CurrentEventId = reviewEvent.EventId,
                        ExpectedRowVersion = expectedCurrentRowVersion,
                    },
                    transaction,
                    cancellationToken: cancellationToken));

            if (affected != 1)
            {
                CurrentPointerRow racedPointer = await connection.QuerySingleAsync<CurrentPointerRow>(
                    new CommandDefinition(
                        """
                        SELECT c.CurrentEventId, c.RowVersionStamp
                        FROM dbo.FindingCurrentDispositions AS c WITH (UPDLOCK, ROWLOCK)
                        WHERE c.TenantId = @TenantId
                          AND c.WorkspaceId = @WorkspaceId
                          AND c.ProjectId = @ProjectId
                          AND c.FindingId = @FindingId;
                        """,
                        new
                        {
                            reviewEvent.TenantId,
                            reviewEvent.WorkspaceId,
                            reviewEvent.ProjectId,
                            FindingId = reviewEvent.FindingId.Trim(),
                        },
                        transaction,
                        cancellationToken: cancellationToken));

                FindingDispositionConflictDetail conflict =
                    await LoadConflictDetailAsync(connection, transaction, racedPointer.CurrentEventId, cancellationToken);

                await transaction.RollbackAsync(cancellationToken);

                return BuildConflictResult(conflict);
            }

            newRowVersion = await connection.QuerySingleAsync<byte[]>(
                new CommandDefinition(
                    """
                    SELECT RowVersionStamp
                    FROM dbo.FindingCurrentDispositions
                    WHERE TenantId = @TenantId
                      AND WorkspaceId = @WorkspaceId
                      AND ProjectId = @ProjectId
                      AND FindingId = @FindingId;
                    """,
                    new
                    {
                        reviewEvent.TenantId,
                        reviewEvent.WorkspaceId,
                        reviewEvent.ProjectId,
                        FindingId = reviewEvent.FindingId.Trim(),
                    },
                    transaction,
                    cancellationToken: cancellationToken));
        }

        await transaction.CommitAsync(cancellationToken);

        return new FindingDispositionRecordResult
        {
            Status = FindingDispositionRecordStatus.Recorded,
            NewCurrentRowVersion = newRowVersion,
        };
    }

    private static async Task AppendEventAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        FindingReviewEventRecord reviewEvent,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           INSERT INTO dbo.FindingReviewEvents
                           (EventId, TenantId, WorkspaceId, ProjectId, FindingId, ReviewerUserId, Action, Notes,
                            OccurredAtUtc, RunId, Disposition, RevisitDueUtc, EvidenceRequestText)
                           VALUES
                           (@EventId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @ReviewerUserId, @Action, @Notes,
                            @OccurredAtUtc, @RunId, @Disposition, @RevisitDueUtc, @EvidenceRequestText);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    reviewEvent.EventId,
                    reviewEvent.TenantId,
                    reviewEvent.WorkspaceId,
                    reviewEvent.ProjectId,
                    reviewEvent.FindingId,
                    reviewEvent.ReviewerUserId,
                    Action = reviewEvent.Action.ToString(),
                    reviewEvent.Notes,
                    reviewEvent.OccurredAtUtc,
                    reviewEvent.RunId,
                    Disposition = reviewEvent.Disposition?.ToString(),
                    RevisitDueUtc = reviewEvent.RevisitDueUtc?.UtcDateTime,
                    reviewEvent.EvidenceRequestText,
                },
                transaction,
                cancellationToken: cancellationToken));
    }

    private static async Task<FindingDispositionConflictDetail> LoadConflictDetailAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid currentEventId,
        CancellationToken cancellationToken)
    {
        EventRow row = await connection.QuerySingleAsync<EventRow>(
            new CommandDefinition(
                """
                SELECT e.EventId, e.FindingId, e.Disposition, e.ReviewerUserId, e.OccurredAtUtc, c.RowVersionStamp
                FROM dbo.FindingReviewEvents AS e
                INNER JOIN dbo.FindingCurrentDispositions AS c
                    ON c.TenantId = e.TenantId
                   AND c.WorkspaceId = e.WorkspaceId
                   AND c.ProjectId = e.ProjectId
                   AND c.FindingId = e.FindingId
                   AND c.CurrentEventId = e.EventId
                WHERE e.EventId = @EventId;
                """,
                new { EventId = currentEventId },
                transaction,
                cancellationToken: cancellationToken));

        Enum.TryParse(row.Disposition, true, out FindingDisposition disposition);

        return new FindingDispositionConflictDetail
        {
            EventId = row.EventId,
            FindingId = row.FindingId,
            Disposition = disposition,
            ReviewerUserId = row.ReviewerUserId,
            OccurredAtUtc = row.OccurredAtUtc,
            CurrentDispositionRowVersionBase64 = Convert.ToBase64String(row.RowVersionStamp),
        };
    }

    private static FindingDispositionRecordResult BuildConflictResult(FindingDispositionConflictDetail conflict)
    {
        return new FindingDispositionRecordResult
        {
            Status = FindingDispositionRecordStatus.Conflict,
            Conflict = conflict,
        };
    }

    private sealed class CurrentPointerRow
    {
        public Guid CurrentEventId
        {
            get;
            init;
        }

        public byte[] RowVersionStamp
        {
            get;
            init;
        } = [];
    }

    private sealed class EventRow
    {
        public Guid EventId
        {
            get;
            init;
        }

        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public string Disposition
        {
            get;
            init;
        } = string.Empty;

        public string ReviewerUserId
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset OccurredAtUtc
        {
            get;
            init;
        }

        public byte[] RowVersionStamp
        {
            get;
            init;
        } = [];
    }
}
