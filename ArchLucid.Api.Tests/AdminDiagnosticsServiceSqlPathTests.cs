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

/// <summary>SQL-backed branches of <see cref="AdminDiagnosticsService" /> using <see cref="ScriptedDbCommand" /> + <see cref="SequencedCommandDbConnection" />.</summary>
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

    private sealed class ScriptedSqlSession(Mock<IDbConnectionFactory> factoryProxy)
    {
        private readonly List<Func<DbCommand>> _commandFactories = new();

        public IDbConnectionFactory Factory => factoryProxy.Object;

        public void EnqueueParameterizedReader(ReadResult result, Action<ScriptedDbCommand>? sideEffect = null)
        {
            _commandFactories.Add(() => BuildReaderCommand(result, sideEffect));
        }

        public void EnqueueNonQuery(int rowsAffected, Action<ScriptedDbCommand>? sideEffect = null)
        {
            _commandFactories.Add(() =>
                BuildNonQueryCommand(Task.FromResult(rowsAffected), sideEffect));
        }

        public void EnqueueFaultingNonQuery(Exception fault, Action<ScriptedDbCommand>? sideEffect = null)
        {
            _commandFactories.Add(() =>
                BuildNonQueryCommand(Task.FromException<int>(fault), sideEffect));
        }

        public SequencedCommandDbConnection Activate()
        {
            Queue<DbCommand> scripted = new();

            foreach (Func<DbCommand> maker in _commandFactories)
                scripted.Enqueue(maker());

            SequencedCommandDbConnection connection = new(scripted);

            factoryProxy.Setup(f => f.CreateConnection()).Returns(connection);

            return connection;
        }
    }

    [Fact]
    public async Task GetDataConsistencyOrphanCountsAsync_sqlPath_maps_execute_scalar_pipeline()
    {
        List<object?> scalarSequence = [11L, 22, Convert.ToDecimal(33), Convert.ToDecimal(44)];

        Mock<IDbConnectionFactory> factory = new();

        ScalarConnection(factory, scalarSequence);

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
            svc => svc.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
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

        SequencedCommandDbConnection connection = session.Activate();

        RecordingDbTransaction transaction = AttachTransaction(connection);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanComparisonRemediationResult result =
            await sut.RemediateOrphanComparisonRecordsAsync(false, 55, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);
        Assert.Single(result.ComparisonRecordIds);

        audit.Verify(
            svc => svc.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.ComparisonRecordOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        "\"deletedCount\":1",
                        "audit-target")),
                It.IsAny<CancellationToken>()),
            Times.Once);

        Assert.False(connection.HasScheduledBeginTransaction);
        Assert.Equal(1, transaction.CommitCalls);
        Assert.Equal(0, transaction.RollbackCalls);
    }

    [Fact]
    public async Task RemediateOrphanComparisonRecordsAsync_execute_sql_when_no_candidates_skips_transaction()
    {
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Empty());

        SequencedCommandDbConnection connection = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory);

        _ = await sut.RemediateOrphanComparisonRecordsAsync(false, 10, CancellationToken.None);

        Assert.False(connection.HasScheduledBeginTransaction);
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

        SequencedCommandDbConnection connection = session.Activate();

        RecordingDbTransaction transaction = AttachTransaction(connection);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanGoldenManifestRemediationResult result =
            await sut.RemediateOrphanGoldenManifestsAsync(false, 4, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);

        audit.Verify(
            svc => svc.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.GoldenManifestOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        manifestId.ToString("D", CultureInfo.InvariantCulture))),
                It.IsAny<CancellationToken>()),
            Times.Once);

        Assert.False(connection.HasScheduledBeginTransaction);
        Assert.Equal(1, transaction.CommitCalls);
        Assert.Equal(0, transaction.RollbackCalls);
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

        SequencedCommandDbConnection connection = session.Activate();

        RecordingDbTransaction transaction = AttachTransaction(connection);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.RemediateOrphanGoldenManifestsAsync(false, 2, CancellationToken.None));

        Assert.False(connection.HasScheduledBeginTransaction);
        Assert.Equal(0, transaction.CommitCalls);
        Assert.Equal(1, transaction.RollbackCalls);

        audit.Verify(
            svc => svc.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
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

        SequencedCommandDbConnection connection = session.Activate();

        RecordingDbTransaction transaction = AttachTransaction(connection);

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory, audit.Object);

        OrphanFindingsSnapshotRemediationResult result =
            await sut.RemediateOrphanFindingsSnapshotsAsync(false, 6, CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);

        audit.Verify(
            svc => svc.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.FindingsSnapshotOrphansRemediated
                    && DataJsonFragments(
                        auditEvent.DataJson,
                        "\"dryRun\":false",
                        snapshotId.ToString("D", CultureInfo.InvariantCulture))),
                It.IsAny<CancellationToken>()),
            Times.Once);

        Assert.False(connection.HasScheduledBeginTransaction);
        Assert.Equal(1, transaction.CommitCalls);
        Assert.Equal(0, transaction.RollbackCalls);
    }

    [Fact]
    public async Task RemediateOrphan_comparison_clamps_MaxRows_to_MaxListingTake()
    {
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedDbCommand? capture = null;

        ScriptedSqlSession session = new(factoryOuter);

        session.EnqueueParameterizedReader(
            ReadResult.Empty(),
            scripted => capture = scripted);

        _ = session.Activate();

        AdminDiagnosticsService sut = CreateDiagnosticsService(session.Factory);

        _ = await sut.RemediateOrphanComparisonRecordsAsync(true, 50_000, CancellationToken.None);

        Assert.NotNull(capture);

        DbParameter? maxRowsParameter = FindParameter(capture!.Parameters, "@MaxRows");

        Assert.NotNull(maxRowsParameter);
        Assert.Equal(
            PaginationDefaults.MaxListingTake,
            Convert.ToInt32(maxRowsParameter.Value, CultureInfo.InvariantCulture));
    }

    private static void ScalarConnection(Mock<IDbConnectionFactory> factoryProxy,
        IReadOnlyList<object?> scalarSequence)
    {
        Queue<DbCommand> queue = new();

        foreach (object? scalar in scalarSequence)
        {
            ScriptedDbCommand shell = new(CreateParameterTemplate) { ScalarAsync = _ => Task.FromResult(scalar) };

            queue.Enqueue(shell);
        }

        SequencedCommandDbConnection connection = new(queue);

        factoryProxy.Setup(f => f.CreateConnection()).Returns(connection);
    }

    private static RecordingDbTransaction AttachTransaction(SequencedCommandDbConnection connection)
    {
        RecordingDbTransaction transaction = new();

        connection.QueueNextBeginTransaction(transaction);

        return transaction;
    }

    private static DbCommand BuildReaderCommand(
        ReadResult result,
        Action<ScriptedDbCommand>? sideEffect)
    {
        ScriptedDbCommand command = new(CreateParameterTemplate)
        {
            ReaderAsync = _ =>
            {
                DbDataReader reader = BuildReader(result);

                return Task.FromResult(reader);
            }
        };

        sideEffect?.Invoke(command);

        return command;
    }

    private static DbCommand BuildNonQueryCommand(
        Task<int> outcome,
        Action<ScriptedDbCommand>? sideEffect)
    {
        ScriptedDbCommand command = new(CreateParameterTemplate) { NonQueryAsync = _ => outcome };

        sideEffect?.Invoke(command);

        return command;
    }

    private static DbDataReader BuildReader(ReadResult result)
    {
        if (result.ComparisonStrings.Count > 0)
            return new ScriptedTabularDbDataReader(result.ComparisonStrings);

        return new ScriptedTabularDbDataReader(result.GuidRows);
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
