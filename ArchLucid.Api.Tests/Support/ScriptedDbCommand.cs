using System.Data;
using System.Data.Common;
using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Tests.Support;

/// <summary>Minimal <see cref="DbCommand" /> for tests — avoids Moq on non-virtual <see cref="DbCommand.Connection" /> / <see cref="DbCommand.Transaction" /> / <see cref="DbCommand.Parameters" /> accessors.</summary>
internal sealed class ScriptedDbCommand : DbCommand
{
    private DbConnection? _connection;

    private DbTransaction? _transaction;

    private readonly ListDbParameterCollection _parameters = new();

    private readonly Func<DbParameter> _createParameter;

    private string _commandText = string.Empty;

    private int _commandTimeout;

    private CommandType _commandType = CommandType.Text;

    private bool _designTimeVisible = true;

    private UpdateRowSource _updatedRowSource = UpdateRowSource.Both;

    public Func<CancellationToken, Task<DbDataReader>>? ReaderAsync { get; set; }

    public Func<CancellationToken, Task<int>>? NonQueryAsync { get; set; }

    public Func<CancellationToken, Task<object?>>? ScalarAsync { get; set; }

    public ScriptedDbCommand(Func<DbParameter> createParameter) =>
        _createParameter = createParameter ?? throw new ArgumentNullException(nameof(createParameter));

    [AllowNull]
    public override string CommandText
    {
        get => _commandText;
        set => _commandText = value ?? string.Empty;
    }

    public override int CommandTimeout
    {
        get => _commandTimeout;
        set => _commandTimeout = value;
    }

    public override CommandType CommandType
    {
        get => _commandType;
        set => _commandType = value;
    }

    public override bool DesignTimeVisible
    {
        get => _designTimeVisible;
        set => _designTimeVisible = value;
    }

    public override UpdateRowSource UpdatedRowSource
    {
        get => _updatedRowSource;
        set => _updatedRowSource = value;
    }

    protected override DbParameterCollection DbParameterCollection => _parameters;

    protected override DbConnection? DbConnection
    {
        get => _connection;
        set => _connection = value;
    }

    protected override DbTransaction? DbTransaction
    {
        get => _transaction;
        set => _transaction = value;
    }

    public override void Cancel()
    {
    }

    public override int ExecuteNonQuery() =>
        ExecuteNonQueryAsync(CancellationToken.None).GetAwaiter().GetResult();

    public override Task<int> ExecuteNonQueryAsync(CancellationToken cancellationToken)
    {
        if (NonQueryAsync is null)
            return Task.FromException<int>(new InvalidOperationException("NonQueryAsync is not configured."));

        return NonQueryAsync(cancellationToken);
    }

    public override object? ExecuteScalar() =>
        ExecuteScalarAsync(CancellationToken.None).GetAwaiter().GetResult();

    public override Task<object?> ExecuteScalarAsync(CancellationToken cancellationToken)
    {
        if (ScalarAsync is null)
            return Task.FromException<object?>(new InvalidOperationException("ScalarAsync is not configured."));

        return ScalarAsync(cancellationToken);
    }

    public override void Prepare()
    {
    }

    protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) =>
        ExecuteDbDataReaderAsync(behavior, CancellationToken.None).GetAwaiter().GetResult();

    protected override Task<DbDataReader> ExecuteDbDataReaderAsync(
        CommandBehavior behavior,
        CancellationToken cancellationToken)
    {
        if (ReaderAsync is null)
        {
            return Task.FromException<DbDataReader>(
                new InvalidOperationException("ReaderAsync is not configured."));
        }

        return ReaderAsync(cancellationToken);
    }

    protected override DbParameter CreateDbParameter() => _createParameter();
}
