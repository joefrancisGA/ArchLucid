#pragma warning disable CS8764, CS8765

using System.Data;
using System.Data.Common;

namespace ArchLucid.Api.Tests.Testing;

internal sealed class StubDbConnection(Func<CancellationToken, Task<object?>> executeScalar) : DbConnection
{
    public override string ConnectionString { get; set; } = string.Empty;

    public override string Database => "stub";

    public override string DataSource => "stub";

    public override string ServerVersion => "1.0";

    public override ConnectionState State => ConnectionState.Open;

    public override void ChangeDatabase(string databaseName)
    {
    }

    public override void Close()
    {
    }

    public override void Open()
    {
    }

    protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel) =>
        throw new NotSupportedException();

    protected override DbCommand CreateDbCommand() =>
        new StubDbCommand(executeScalar);
}

internal sealed class StubDbCommand(Func<CancellationToken, Task<object?>> executeScalar) : DbCommand
{
    public override string CommandText { get; set; } = "SELECT 1;";

    public override int CommandTimeout { get; set; }

    public override CommandType CommandType { get; set; } = CommandType.Text;

    public override bool DesignTimeVisible { get; set; }

    public override UpdateRowSource UpdatedRowSource { get; set; }

    protected override DbConnection? DbConnection { get; set; }

    protected override DbParameterCollection DbParameterCollection { get; } = new StubDbParameterCollection();

    protected override DbTransaction? DbTransaction { get; set; }

    public override void Cancel()
    {
    }

    public override int ExecuteNonQuery() => throw new NotSupportedException();

    public override object? ExecuteScalar() =>
        ExecuteScalarAsync(CancellationToken.None).GetAwaiter().GetResult();

    public override void Prepare()
    {
    }

    protected override DbParameter CreateDbParameter() => new StubDbParameter();

    protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) =>
        throw new NotSupportedException();

    public override Task<object?> ExecuteScalarAsync(CancellationToken cancellationToken) =>
        executeScalar(cancellationToken);
}

internal sealed class StubDbParameter : DbParameter
{
    public override DbType DbType { get; set; }

    public override ParameterDirection Direction { get; set; }

    public override bool IsNullable { get; set; }

    public override string ParameterName { get; set; } = string.Empty;

    public override int Size { get; set; }

    public override string SourceColumn { get; set; } = string.Empty;

    public override bool SourceColumnNullMapping { get; set; }

    public override object? Value { get; set; }

    public override void ResetDbType()
    {
    }
}

internal sealed class StubDbParameterCollection : DbParameterCollection
{
    public override int Count => 0;

    public override object SyncRoot { get; } = new();

    public override int Add(object value) => throw new NotSupportedException();

    public override void AddRange(Array values)
    {
    }

    public override void Clear()
    {
    }

    public override bool Contains(object value) => false;

    public override bool Contains(string value) => false;

    public override void CopyTo(Array array, int index)
    {
    }

    public override System.Collections.IEnumerator GetEnumerator() =>
        Array.Empty<object>().GetEnumerator();

    public override int IndexOf(object value) => -1;

    public override int IndexOf(string parameterName) => -1;

    public override void Insert(int index, object value)
    {
    }

    public override void Remove(object value)
    {
    }

    public override void RemoveAt(int index)
    {
    }

    public override void RemoveAt(string parameterName)
    {
    }

    protected override DbParameter GetParameter(int index) => throw new NotSupportedException();

    protected override DbParameter GetParameter(string parameterName) => throw new NotSupportedException();

    protected override void SetParameter(int index, DbParameter value)
    {
    }

    protected override void SetParameter(string parameterName, DbParameter value)
    {
    }
}
