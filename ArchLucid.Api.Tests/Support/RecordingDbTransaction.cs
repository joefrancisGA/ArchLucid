using System.Data;
using System.Data.Common;

namespace ArchLucid.Api.Tests.Support;

/// <summary>In-memory recording <see cref="DbTransaction"/> for scripted <see cref="DbConnection.BeginTransactionAsync"/> flows.</summary>
internal sealed class RecordingDbTransaction : DbTransaction
{
    private DbConnection? _databaseConnection;

    public int CommitCalls
    {
        get;
        private set;
    }

    public int RollbackCalls
    {
        get;
        private set;
    }

    public override IsolationLevel IsolationLevel =>
        IsolationLevel.Unspecified;

    protected override DbConnection DbConnection =>
        _databaseConnection ?? throw new InvalidOperationException("RecordingDbTransaction is not bound to a connection.");

    internal void BindConnection(DbConnection connection)
    {
        ArgumentNullException.ThrowIfNull(connection);
        _databaseConnection ??= connection;
    }

    public override void Commit() => CommitCalls++;

    public override void Rollback() => RollbackCalls++;

    public override Task CommitAsync(CancellationToken cancellationToken = default)
    {
        CommitCalls++;

        return Task.CompletedTask;
    }

    public override Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        RollbackCalls++;

        return Task.CompletedTask;
    }
}
