using System.Collections;
using System.Data.Common;

namespace ArchLucid.Api.Tests.Support;

/// <summary>Single-column <see cref="DbDataReader" /> for SQL-path tests (string or <see cref="Guid" /> cells), without Moq.</summary>
internal sealed class ScriptedTabularDbDataReader : DbDataReader
{
    private static readonly IReadOnlyList<string> EmptyStrings = [];

    private static readonly IReadOnlyList<Guid> EmptyGuids = [];

    private readonly IReadOnlyList<string> _strings;

    private readonly IReadOnlyList<Guid> _guids;

    private readonly bool _stringMode;

    private int _row = -1;

    private bool _closed;

    public ScriptedTabularDbDataReader(IReadOnlyList<string> comparisonStrings)
    {
        ArgumentNullException.ThrowIfNull(comparisonStrings);
        _strings = comparisonStrings;
        _guids = EmptyGuids;
        _stringMode = true;
    }

    public ScriptedTabularDbDataReader(IReadOnlyList<Guid> guidRows)
    {
        ArgumentNullException.ThrowIfNull(guidRows);
        _strings = EmptyStrings;
        _guids = guidRows;
        _stringMode = false;
    }

    private int RowCount => _stringMode ? _strings.Count : _guids.Count;

    public override int Depth => 0;

    public override int FieldCount => 1;

    public override bool HasRows => RowCount > 0;

    public override bool IsClosed => _closed;

    public override int RecordsAffected => -1;

    public override object this[int ordinal] => GetValue(ordinal);

    public override object this[string name] => GetValue(GetOrdinal(name));

    public override bool Read()
    {
        _row++;

        return _row < RowCount;
    }

    public override Task<bool> ReadAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(Read());
    }

    public override string GetDataTypeName(int ordinal) =>
        ordinal == 0
            ? (_stringMode ? "nvarchar" : "uniqueidentifier")
            : throw new ArgumentOutOfRangeException(nameof(ordinal));

    public override IEnumerator GetEnumerator() => new ScriptedTabularDbDataReaderEnumerator(this);

    public override Type GetFieldType(int ordinal) =>
        ordinal == 0 ? (_stringMode ? typeof(string) : typeof(Guid)) : throw new ArgumentOutOfRangeException(nameof(ordinal));

    public override string GetName(int ordinal) => ordinal == 0 ? "c0" : throw new ArgumentOutOfRangeException(nameof(ordinal));

    public override int GetOrdinal(string name)
    {
        ArgumentNullException.ThrowIfNull(name);

        if (string.Equals(name, "c0", StringComparison.OrdinalIgnoreCase))
            return 0;

        throw new ArgumentOutOfRangeException(nameof(name));
    }

    public override string GetString(int ordinal)
    {
        if (ordinal != 0 || !_stringMode)
            throw new ArgumentOutOfRangeException(nameof(ordinal));

        return _strings[_row];
    }

    public override Guid GetGuid(int ordinal)
    {
        if (ordinal != 0 || _stringMode)
            throw new ArgumentOutOfRangeException(nameof(ordinal));

        return _guids[_row];
    }

    public override object GetValue(int ordinal)
    {
        if (ordinal != 0)
            throw new ArgumentOutOfRangeException(nameof(ordinal));

        return _stringMode ? _strings[_row] : _guids[_row];
    }

    public override int GetValues(object[] values)
    {
        ArgumentNullException.ThrowIfNull(values);

        if (values.Length == 0)
            return 0;

        values[0] = GetValue(0);

        return 1;
    }

    public override bool IsDBNull(int ordinal) => false;

    public override bool NextResult() => false;

    public override bool GetBoolean(int ordinal) => throw new NotSupportedException();

    public override byte GetByte(int ordinal) => throw new NotSupportedException();

    public override long GetBytes(int ordinal, long dataOffset, byte[]? buffer, int bufferOffset, int length) =>
        throw new NotSupportedException();

    public override char GetChar(int ordinal) => throw new NotSupportedException();

    public override long GetChars(int ordinal, long dataOffset, char[]? buffer, int bufferOffset, int length) =>
        throw new NotSupportedException();

    public override DateTime GetDateTime(int ordinal) => throw new NotSupportedException();

    public override decimal GetDecimal(int ordinal) => throw new NotSupportedException();

    public override double GetDouble(int ordinal) => throw new NotSupportedException();

    public override float GetFloat(int ordinal) => throw new NotSupportedException();

    public override short GetInt16(int ordinal) => throw new NotSupportedException();

    public override int GetInt32(int ordinal) => throw new NotSupportedException();

    public override long GetInt64(int ordinal) => throw new NotSupportedException();

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            _closed = true;

        base.Dispose(disposing);
    }
}
