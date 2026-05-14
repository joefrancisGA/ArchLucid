using System.Data;
using System.Data.Common;

using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Tests.Support;

/// <summary>
/// <see cref="DbConnection"/> stub draining a scripted <see cref="DbCommand"/> queue when <see cref="CreateCommand"/> is invoked,
/// optionally binding a queued <see cref="RecordingDbTransaction"/> for <see cref="BeginDbTransactionAsync"/>.
/// </summary>
internal sealed class SequencedCommandDbConnection : DbConnection
{
    private ConnectionState _state = ConnectionState.Closed;

    private readonly Queue<DbCommand> _scriptedCommands;

    private RecordingDbTransaction? _queuedTransaction;

    internal SequencedCommandDbConnection(Queue<DbCommand> scriptedCommands) =>
        _scriptedCommands = scriptedCommands ??
                            throw new ArgumentNullException(nameof(scriptedCommands));

    internal void QueueNextBeginTransaction(RecordingDbTransaction transaction) =>
        _queuedTransaction =
            transaction ?? throw new ArgumentNullException(nameof(transaction));

    /// <summary>True when <see cref="QueueNextBeginTransaction"/> was called and Begin has not consumed that script.</summary>
    internal bool HasScheduledBeginTransaction =>
        _queuedTransaction is not null;

    private string _connectionString = string.Empty;

    /// <inheritdoc />
    /// <remarks><see cref="DbConnection.ConnectionString" /> allows null assignment; we normalize to empty string.</remarks>
    [AllowNull]
    public override string ConnectionString
    {
        get => _connectionString;

        set => _connectionString = value ?? string.Empty;
    }
    public override string Database => string.Empty;

    public override string DataSource => string.Empty;

    public override string ServerVersion => string.Empty;

    public override ConnectionState State => _state;

    public override void ChangeDatabase(string databaseName)
    {
    }

    public override void Close() =>
        _state = ConnectionState.Closed;

    public override void Open() =>
        _state = ConnectionState.Open;

    public override Task OpenAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        Open();

        return Task.CompletedTask;
    }

    protected override ValueTask<DbTransaction> BeginDbTransactionAsync(
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        RecordingDbTransaction transaction = ConsumeQueuedTransaction(nameof(BeginDbTransactionAsync));

        transaction.BindConnection(this);

        return ValueTask.FromResult<DbTransaction>(transaction);
    }

    protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel)
    {
        RecordingDbTransaction transaction = ConsumeQueuedTransaction(nameof(BeginDbTransaction));

        transaction.BindConnection(this);

        return transaction;
    }

    protected override DbCommand CreateDbCommand()
    {
        if (_scriptedCommands.Count == 0)
            throw new InvalidOperationException("No scripted DbCommand left for CreateCommand.");

        return _scriptedCommands.Dequeue();
    }

    private RecordingDbTransaction ConsumeQueuedTransaction(string callerMember)
    {
        RecordingDbTransaction? transaction =
            _queuedTransaction ?? throw new InvalidOperationException(
                $"{callerMember} invoked without scripting a RecordingDbTransaction first.");

        _queuedTransaction = null;

        return transaction;
    }
}
