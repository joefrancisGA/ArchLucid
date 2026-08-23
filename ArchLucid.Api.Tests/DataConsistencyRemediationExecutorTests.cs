using System.Data.Common;

using ArchLucid.Api.Tests.Support;
using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Data.Infrastructure;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>SQL-backed tests for <see cref="DataConsistencyRemediationExecutor" />.</summary>
[Trait("Suite", "Core")]
public sealed class DataConsistencyRemediationExecutorTests
{
    [Fact]
    public async Task ExecuteAsync_dryRun_reads_candidates_without_audit_or_transaction()
    {
        Mock<IDbConnectionFactory> factory = new();
        Mock<IAuditService> audit = new();
        ScriptedSqlSession session = new(factory);
        session.EnqueueParameterizedReader(ReadResult.Strings("cmp-1", "cmp-2"));
        session.Activate();

        DataConsistencyRemediationExecutor sut = new(session.Factory, audit.Object);

        DataConsistencyRemediationResult result = await sut.ExecuteAsync(
            DataConsistencyOrphanRemediationRegistry.ComparisonRecords,
            dryRun: true,
            maxRows: 5,
            CancellationToken.None);

        Assert.True(result.DryRun);
        Assert.Equal(2, result.RowCount);
        Assert.Equal(["cmp-1", "cmp-2"], result.RemediatedIds);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ExecuteAsync_execute_commits_transaction_and_audits_deleted_rows()
    {
        Mock<IDbConnectionFactory> factory = new();
        Mock<IAuditService> audit = new();
        ScriptedSqlSession session = new(factory);
        session.EnqueueParameterizedReader(ReadResult.Strings("cmp-1"));
        session.EnqueueParameterizedReader(ReadResult.Strings("cmp-1"));
        SequencedCommandDbConnection connection = session.Activate();
        RecordingDbTransaction transaction = AttachTransaction(connection);

        DataConsistencyRemediationExecutor sut = new(session.Factory, audit.Object);

        DataConsistencyRemediationResult result = await sut.ExecuteAsync(
            DataConsistencyOrphanRemediationRegistry.ComparisonRecords,
            dryRun: false,
            maxRows: 10,
            CancellationToken.None);

        Assert.False(result.DryRun);
        Assert.Equal(1, result.RowCount);
        Assert.Equal(["cmp-1"], result.RemediatedIds);
        Assert.Equal(1, transaction.CommitCalls);
        Assert.Equal(0, transaction.RollbackCalls);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e =>
                    e.EventType == AuditEventTypes.ComparisonRecordOrphansRemediated
                    && e.DataJson != null
                    && e.DataJson.Contains("cmp-1", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_execute_fault_on_delete_rolls_back_transaction()
    {
        Mock<IDbConnectionFactory> factory = new();
        Mock<IAuditService> audit = new();
        ScriptedSqlSession session = new(factory);
        session.EnqueueParameterizedReader(ReadResult.Strings("cmp-1"));
        session.EnqueueFaultingReader(new InvalidOperationException("delete failed"));

        SequencedCommandDbConnection connection = session.Activate();
        RecordingDbTransaction transaction = AttachTransaction(connection);
        DataConsistencyRemediationExecutor sut = new(session.Factory, audit.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.ExecuteAsync(
                DataConsistencyOrphanRemediationRegistry.ComparisonRecords,
                dryRun: false,
                maxRows: 3,
                CancellationToken.None));

        Assert.False(connection.HasScheduledBeginTransaction);
        Assert.Equal(0, transaction.CommitCalls);
        Assert.Equal(1, transaction.RollbackCalls);
        audit.Verify(
            a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static RecordingDbTransaction AttachTransaction(SequencedCommandDbConnection connection)
    {
        RecordingDbTransaction transaction = new();
        connection.QueueNextBeginTransaction(transaction);

        return transaction;
    }

    private sealed record ReadResult(IReadOnlyList<string> ComparisonStrings, IReadOnlyList<Guid> GuidRows)
    {
        public static ReadResult Strings(params string[] values) => new(values, []);
    }

    private sealed class ScriptedSqlSession(Mock<IDbConnectionFactory> factoryProxy)
    {
        private readonly List<Func<DbCommand>> _commandFactories = [];

        public IDbConnectionFactory Factory => factoryProxy.Object;

        public void EnqueueParameterizedReader(ReadResult result, Action<ScriptedDbCommand>? sideEffect = null)
        {
            _commandFactories.Add(() => BuildReaderCommand(result, sideEffect));
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

        private static DbCommand BuildReaderCommand(
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
    }
}
