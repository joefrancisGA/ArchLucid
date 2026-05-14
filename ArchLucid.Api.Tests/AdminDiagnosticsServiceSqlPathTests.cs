using System.Data.Common;
using System.Globalization;

using ArchLucid.Api.Services.Admin;
using ArchLucid.Api.Tests.Support;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.Options;

using Moq;

using Xunit;

namespace ArchLucid.Api.Tests;

/// <summary>SQL-backed branches of <see cref="AdminDiagnosticsService" /> exercised with Moq-backed <see cref="DbConnection" />.</summary>
[Trait("Suite", "Core")]
public sealed class AdminDiagnosticsServiceSqlPathTests
{
    private sealed record ReadResult(IReadOnlyList<string> ComparisonStrings, IReadOnlyList<Guid> GuidRows)
    {
        public static ReadResult Empty() => new([], []);

        public static ReadResult Strings(params string[] values) => new(values, []);

        /// <returns>Candidate rows surfaced as <see cref="DbDataReader.GetGuid"/>.</returns>
        public static ReadResult OnlyGuids(params Guid[] ids) => new([], ids);
    }

    /// <summary>Holds a factory + queued <see cref="DbCommand" /> builders wired to a single <see cref="DbConnection" />.</summary>
    private sealed class ScriptedSqlSession(Mock<IDbConnectionFactory> factoryProxy)
    {
        private readonly Queue<Func<Mock<DbConnection>, DbCommand>> _commandBuilders = new();

        public IDbConnectionFactory Factory => factoryProxy.Object;

        public void EnqueueParameterizedReader(ReadResult result, Action<Mock<DbCommand>>? sideEffect = null)
        {
            _commandBuilders.Enqueue(connection =>
                BuildReaderCommand(connection, result, sideEffect));
        }

        public void EnqueueNonQuery(int rowsAffected, Action<Mock<DbCommand>>? sideEffect = null)
        {
            _commandBuilders.Enqueue(connection =>
                BuildNonQueryCommand(connection, Task.FromResult(rowsAffected), sideEffect));
        }

        public void EnqueueFaultingNonQuery(Exception fault, Action<Mock<DbCommand>>? sideEffect = null)
        {
            _commandBuilders.Enqueue(connection =>
                BuildNonQueryCommand(connection, Task.FromException<int>(fault), sideEffect));
        }

        /// <summary>Applies <see cref="AttachTransaction" /> to the connection created for this session.</summary>
        public Mock<DbConnection> Activate()
        {
            Mock<DbConnection> connection = new(MockBehavior.Loose);
            connection.Setup(c => c.OpenAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

            Mock<DbConnection> connectionCapture = connection;

            connection.Setup(c => c.CreateCommand()).Returns(() =>
            {
                if (_commandBuilders.Count == 0)
                    throw new InvalidOperationException("No DbCommand was scripted for this CreateCommand call.");

                Func<Mock<DbConnection>, DbCommand> next = _commandBuilders.Dequeue();

                return next(connectionCapture);
            });

            factoryProxy
                .Setup(f => f.CreateConnection())
                .Returns(connection.Object);

            return connection;
        }
    }

    [Fact]
    public async Task GetDataConsistencyOrphanCountsAsync_sqlPath_maps_execute_scalar_pipeline()
    {
        List<object?> scalarSequence = [11L, Convert.ToDecimal(33), 22, Convert.ToDecimal(44)];

        Mock<IDbConnectionFactory> factory = new();
        _ = ScalarConnection(factory, scalarSequence);

        AdminDiagnosticsService sut = CreateDiagnosticsService(factory.Object);

        DataConsistencyOrphanCounts counts =
            await sut.GetDataConsistencyOrphanCountsAsync(CancellationToken.None);

        DataConsistencyOrphanCounts expected = new(
            ComparisonRecordsLeftRunIdOrphans: 0,
            ComparisonRecordsRightRunIdOrphans: 0,
            GoldenManifestsRunIdOrphans: 11,
            FindingsSnapshotsRunIdOrphans: 22,
            ContextSnapshotsRunIdOrphans: 33,
            GraphSnapshotsRunIdOrphans: 44);

        Assert.Equal(expected, counts);
    }

    [Fact]
    public async Task RemediateOrphanComparisonRecordsAsync_dryRun_sql_reads_candidates_without_audit()
    {
        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Strings("comparison-key-42"));

        _ = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanComparisonRemediationResult result =
            await sut.RemediateOrphanComparisonRecordsAsync(true, 5, CancellationToken.None);

        Assert.True(result.DryRun);
        Assert.Equal(1, result.RowCount);
        Assert.Single(result.ComparisonRecordIds);
        Assert.Equal("comparison-key-42", result.ComparisonRecordIds[0]);

        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RemediateOrphanComparisonRecordsAsync_execute_sql_audits_deleted_rows()
    {
        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Strings("audit-target"));
        session.EnqueueParameterizedReader(ReadResult.Strings("audit-target"));

        Mock<DbConnection> conn = session.Activate();

        Mock<DbTransaction> tx = AttachTransaction(conn);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanComparisonRemediationResult result =
            await sut.RemediateOrphanComparisonRecordsAsync(false, 55, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);
        Assert.Single(result.ComparisonRecordIds);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.ComparisonRecordOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        "\"deletedCount\":1",
                        "audit-target")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        tx.Verify(transaction => transaction.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        tx.Verify(transaction => transaction.RollbackAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RemediateOrphanComparisonRecordsAsync_execute_sql_when_no_candidates_skips_transaction()
    {
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Empty());

        Mock<DbConnection> conn = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory);

        _ = await sut.RemediateOrphanComparisonRecordsAsync(false, 10, CancellationToken.None);

        conn.Verify(
            c => c.BeginTransactionAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RemediateOrphanGoldenManifestsAsync_dryRun_sql_projects_manifest_candidates()
    {
        Guid manifestId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(manifestId));

        _ = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory);

        OrphanGoldenManifestRemediationResult result =
            await sut.RemediateOrphanGoldenManifestsAsync(true, 9, CancellationToken.None);

        Assert.True(result.DryRun);
        Assert.Equal(1, result.RowCount);
        Assert.Single(result.ManifestIds);
        Assert.Equal(manifestId.ToString("D", CultureInfo.InvariantCulture), result.ManifestIds[0]);
    }

    [Fact]
    public async Task RemediateOrphanGoldenManifestsAsync_execute_sql_commits_bundle_delete_then_manifest_delete()
    {
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(manifestId));
        session.EnqueueNonQuery(1);
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(manifestId));

        Mock<DbConnection> conn = session.Activate();

        Mock<DbTransaction> tx = AttachTransaction(conn);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanGoldenManifestRemediationResult result =
            await sut.RemediateOrphanGoldenManifestsAsync(false, 4, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.GoldenManifestOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        manifestId.ToString("D", CultureInfo.InvariantCulture))),
                It.IsAny<CancellationToken>()),
            Times.Once);

        tx.Verify(transaction => transaction.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        tx.Verify(transaction => transaction.RollbackAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RemediateOrphanGoldenManifests_execute_sql_fault_during_bundle_delete_rolls_transaction_back()
    {
        Guid manifestId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(manifestId));
        session.EnqueueFaultingNonQuery(new InvalidOperationException("bundle delete fault"));

        Mock<DbConnection> conn = session.Activate();

        Mock<DbTransaction> tx = AttachTransaction(conn);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.RemediateOrphanGoldenManifestsAsync(false, 2, CancellationToken.None));

        tx.Verify(transaction => transaction.RollbackAsync(It.IsAny<CancellationToken>()), Times.Once);
        tx.Verify(transaction => transaction.CommitAsync(It.IsAny<CancellationToken>()), Times.Never);

        audit.Verify(
            service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task RemediateOrphanFindingsSnapshotsAsync_execute_sql_logs_findings_audit()
    {
        Guid snapshotId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(snapshotId));
        session.EnqueueParameterizedReader(ReadResult.OnlyGuids(snapshotId));

        Mock<DbConnection> conn = session.Activate();

        Mock<DbTransaction> tx = AttachTransaction(conn);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanFindingsSnapshotRemediationResult result =
            await sut.RemediateOrphanFindingsSnapshotsAsync(false, 6, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.FindingsSnapshotOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        snapshotId.ToString("D", CultureInfo.InvariantCulture))),
                It.IsAny<CancellationToken>()),
            Times.Once);

        tx.Verify(transaction => transaction.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
        tx.Verify(transaction => transaction.RollbackAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RemediateOrphan_comparison_clamps_MaxRows_to_MaxListingTake()
    {
        Mock<IDbConnectionFactory> factoryOuter = new();

        Mock<DbCommand>? capture = null;

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(
            ReadResult.Empty(),
            captured => capture = captured);

        _ = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory);

        _ = await sut.RemediateOrphanComparisonRecordsAsync(true, 50_000, CancellationToken.None);

        Assert.NotNull(capture);

        DbParameter? maxRowsParameter = FindParameter(capture!.Object.Parameters, "@MaxRows");

        Assert.NotNull(maxRowsParameter);
        Assert.Equal(
            PaginationDefaults.MaxListingTake,
            Convert.ToInt32(maxRowsParameter.Value, CultureInfo.InvariantCulture));
    }

    private static DbConnection ScalarConnection(Mock<IDbConnectionFactory> factoryProxy,
        IReadOnlyList<object?> scalarSequence)
    {
        Queue<object?> remaining = new(scalarSequence);
        Mock<DbConnection> conn = new(MockBehavior.Loose);
        conn.Setup(c =>
                c.OpenAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<DbConnection> connectionCapture = conn;

        conn.Setup(c => c.CreateCommand()).Returns(() =>
        {
            if (remaining.Count == 0)
                throw new InvalidOperationException("Scalar sequence exhausted.");

            object? scalar = remaining.Dequeue();
            Mock<DbCommand> command = BaseCommand(connectionCapture);

            command.Setup(cm =>
                    cm.ExecuteScalarAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(scalar);

            return command.Object;
        });

        factoryProxy
            .Setup(f => f.CreateConnection())
            .Returns(conn.Object);

        return conn.Object;
    }

    private static Mock<DbTransaction> AttachTransaction(Mock<DbConnection> connection)
    {
        Mock<DbTransaction> tx = new(MockBehavior.Loose);

        tx.Setup(t =>
                t.CommitAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        tx.Setup(t =>
                t.RollbackAsync(It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        connection.Setup(c =>
                c.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .Returns(() => new ValueTask<DbTransaction>(tx.Object));

        return tx;
    }

    private static DbCommand BuildReaderCommand(
        Mock<DbConnection> connection,
        ReadResult result,
        Action<Mock<DbCommand>>? sideEffect)
    {
        Mock<DbCommand> command = BaseCommand(connection);
        Mock<DbDataReader> reader = BuildReader(result);

        command.Setup(cm =>
                cm.ExecuteReaderAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(reader.Object);

        sideEffect?.Invoke(command);

        return command.Object;
    }

    private static DbCommand BuildNonQueryCommand(
        Mock<DbConnection> connection,
        Task<int> outcome,
        Action<Mock<DbCommand>>? sideEffect)
    {
        Mock<DbCommand> command = BaseCommand(connection);

        command.Setup(cm =>
                cm.ExecuteNonQueryAsync(It.IsAny<CancellationToken>()))
            .Returns(outcome);

        sideEffect?.Invoke(command);

        return command.Object;
    }

    private static Mock<DbDataReader> BuildReader(ReadResult result)
    {
        Mock<DbDataReader> reader = new(MockBehavior.Loose);

        if (result.ComparisonStrings.Count > 0)
        {
            int index = -1;

            reader.Setup(r =>
                    r.ReadAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    index++;

                    return index < result.ComparisonStrings.Count;
                });

            reader.Setup(r => r.GetString(0))
                .Returns(() => result.ComparisonStrings[index]);
        }
        else
        {
            int index = -1;

            reader.Setup(r =>
                    r.ReadAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(() =>
                {
                    index++;

                    return index < result.GuidRows.Count;
                });

            reader.Setup(r => r.GetGuid(0))
                .Returns(() => result.GuidRows[index]);
        }

        return reader;
    }

    private static Mock<DbCommand> BaseCommand(
        Mock<DbConnection> connection)
    {
        Mock<DbCommand> command = new(MockBehavior.Loose);

        command.SetupProperty(cm => cm.Transaction);

        command.SetupGet(cm => cm.Connection)
            .Returns(connection.Object);

        command.SetupGet(cm => cm.Parameters)
            .Returns(new ListDbParameterCollection());

        command.Setup(cm => cm.CreateParameter())
            .Returns(CreateParameterTemplate);

        return command;
    }

    private static DbParameter CreateParameterTemplate()
    {
        Mock<DbParameter> parameter = new(MockBehavior.Loose);

        parameter.SetupAllProperties();

        return parameter.Object;
    }

    private static DbParameter? FindParameter(DbParameterCollection parameters, string name)
    {
        foreach (DbParameter candidate in parameters)
        {
            if (string.Equals(candidate.ParameterName, name, StringComparison.OrdinalIgnoreCase))
                return candidate;
        }

        return null;
    }

    private static bool DataJsonFragments(string? json, params string[] fragments)
    {
        if (json is null)
            return false;

        foreach (string fragment in fragments)
        {
            if (!json.Contains(fragment, StringComparison.Ordinal))
                return false;
        }

        return true;
    }

    private static AdminDiagnosticsService CreateDiagnosticsService(
        IDbConnectionFactory connectionFactory,
        IAuditService? audit = null)
    {
        Mock<IAuthorityPipelineWorkRepository> authority = new();
        Mock<IRetrievalIndexingOutboxRepository> retrieval = new();
        Mock<IIntegrationEventOutboxRepository> integration = new();
        Mock<IHostLeaderLeaseRepository> hostLeases = new();
        Mock<IRunRepository> runs = new();

        ArchLucidOptions options = new()
        {
            StorageProvider = "Sql"
        };

        IAuditService auditService = audit ?? new Mock<IAuditService>().Object;

        Mock<IActorContext> actor = new();

        actor.Setup(ctx => ctx.GetActor()).Returns("sql-path-test");

        return new AdminDiagnosticsService(
            authority.Object,
            retrieval.Object,
            integration.Object,
            hostLeases.Object,
            runs.Object,
            connectionFactory,
            Options.Create(options),
            actor.Object,
            auditService);
    }
}
