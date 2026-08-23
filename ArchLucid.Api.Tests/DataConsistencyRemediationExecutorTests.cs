using System.Data.Common;
using System.Globalization;

using ArchLucid.Api.Services.Admin;
using ArchLucid.Api.Tests.Support;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Persistence.Data.Infrastructure;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>SQL-backed branches of <see cref="DataConsistencyRemediationExecutor" />.</summary>
[Trait("Suite", "Core")]
public sealed class DataConsistencyRemediationExecutorTests
{
    private sealed record ReadResult(IReadOnlyList<string> ComparisonStrings, IReadOnlyList<Guid> GuidRows)
    {
        public static ReadResult Empty() => new([], []);

        public static ReadResult Strings(params string[] values) => new(values, []);

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

        public void EnqueueFaultingReader(Exception fault, Action<ScriptedDbCommand>? sideEffect = null)
        {
            _commandFactories.Add(() =>
            {
                ScriptedDbCommand command = new(CreateParameterTemplate)
                {
                    ReaderAsync = _ => Task.FromException<DbDataReader>(fault)
                };

                sideEffect?.Invoke(command);

                return command;
            });
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
    public async Task ExecuteAsync_comparison_dryRun_reads_candidates_without_audit()
    {
        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Strings("comparison-key-42"));

        _ = session.Activate();

        DataConsistencyRemediationExecutor sut =
            new(session.Factory, audit.Object);

        DataConsistencyRemediationOutcome outcome = await sut.ExecuteAsync(
            DataConsistencyRemediationDefinitions.OrphanComparisonRecords,
            true,
            5,
            CancellationToken.None);

        Assert.True(outcome.DryRun);
        Assert.Equal(1, outcome.RowCount);
        Assert.Single(outcome.DeletedIds);
        Assert.Equal("comparison-key-42", outcome.DeletedIds[0]);

        audit.Verify(
            svc => svc.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_comparison_execute_audits_deleted_rows()
    {
        Mock<IAuditService> audit = new();
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedSqlSession session = new(factoryOuter);
        session.EnqueueParameterizedReader(ReadResult.Strings("audit-target"));
        session.EnqueueParameterizedReader(ReadResult.Strings("audit-target"));

        SequencedCommandDbConnection connection = session.Activate();

        RecordingDbTransaction transaction = AttachTransaction(connection);

        DataConsistencyRemediationExecutor sut =
            new(session.Factory, audit.Object);

        DataConsistencyRemediationOutcome outcome = await sut.ExecuteAsync(
            DataConsistencyRemediationDefinitions.OrphanComparisonRecords,
            false,
            55,
            CancellationToken.None);

        Assert.False(outcome.DryRun);
        Assert.Equal(1, outcome.RowCount);
        Assert.Single(outcome.DeletedIds);

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
    public async Task ExecuteAsync_goldenManifest_execute_commits_bundle_delete_then_manifest_delete()
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

        DataConsistencyRemediationExecutor sut =
            new(session.Factory, audit.Object);

        DataConsistencyRemediationOutcome outcome = await sut.ExecuteAsync(
            DataConsistencyRemediationDefinitions.OrphanGoldenManifests,
            false,
            4,
            CancellationToken.None);

        Assert.False(outcome.DryRun);
        Assert.Equal(1, outcome.RowCount);

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
    public async Task ExecuteAsync_clamps_MaxRows_to_MaxListingTake()
    {
        Mock<IDbConnectionFactory> factoryOuter = new();

        ScriptedDbCommand? capture = null;

        ScriptedSqlSession session = new(factoryOuter);

        session.EnqueueParameterizedReader(
            ReadResult.Empty(),
            scripted => capture = scripted);

        _ = session.Activate();

        DataConsistencyRemediationExecutor sut =
            new(session.Factory, new Mock<IAuditService>().Object);

        _ = await sut.ExecuteAsync(
            DataConsistencyRemediationDefinitions.OrphanComparisonRecords,
            true,
            50_000,
            CancellationToken.None);

        Assert.NotNull(capture);

        DbParameter? maxRowsParameter = FindParameter(capture!.Parameters, "@MaxRows");

        Assert.NotNull(maxRowsParameter);
        Assert.Equal(
            PaginationDefaults.MaxListingTake,
            Convert.ToInt32(maxRowsParameter.Value, CultureInfo.InvariantCulture));
    }

    private static DbParameter CreateParameterTemplate()
    {
        Mock<DbParameter> parameter = new(MockBehavior.Loose);

        parameter.SetupAllProperties();

        return parameter.Object;
    }

    private static ScriptedDbCommand BuildReaderCommand(
        ReadResult result,
        Action<ScriptedDbCommand>? sideEffect)
    {
        ScriptedDbCommand command = new(CreateParameterTemplate)
        {
            ReaderAsync = _ => Task.FromResult<DbDataReader>(BuildReader(result))
        };

        sideEffect?.Invoke(command);

        return command;
    }

    private static ScriptedDbCommand BuildNonQueryCommand(
        Task<int> outcome,
        Action<ScriptedDbCommand>? sideEffect)
    {
        ScriptedDbCommand command = new(CreateParameterTemplate)
        {
            NonQueryAsync = _ => outcome
        };

        sideEffect?.Invoke(command);

        return command;
    }

    private static DbDataReader BuildReader(ReadResult result)
    {
        if (result.ComparisonStrings.Count > 0)
            return new ScriptedTabularDbDataReader(result.ComparisonStrings);

        return new ScriptedTabularDbDataReader(result.GuidRows);
    }

    private static RecordingDbTransaction AttachTransaction(SequencedCommandDbConnection connection)
    {
        RecordingDbTransaction transaction = new();

        connection.QueueNextBeginTransaction(transaction);

        return transaction;
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
}
