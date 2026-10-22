using System.Collections;
using System.Data.Common;

namespace ArchLucid.Api.Tests.Support;

/// <summary>List-backed <see cref="DbParameterCollection"/> for mocking <see cref="DbCommand.Parameters" />.</summary>
internal sealed class ListDbParameterCollection : DbParameterCollection
{
    private readonly List<DbParameter> _parameters = [];

    public override int Count => _parameters.Count;

    public override bool IsSynchronized => false;

    public override bool IsFixedSize => false;

    public override bool IsReadOnly => false;

    public override object SyncRoot => this;

    public override int Add(object value)
    {
        DbParameter dbParameter = (DbParameter)value;
        ArgumentNullException.ThrowIfNull(dbParameter);

        _parameters.Add(dbParameter);

        return _parameters.Count - 1;
    }

    public override void AddRange(Array values)
    {
        ArgumentNullException.ThrowIfNull(values);

        foreach (object entry in values)
            _ = Add(entry);
    }

    public override void Clear() => _parameters.Clear();

    public override bool Contains(string value)
    {
        return IndexOf(value) >= 0;
    }

    public override bool Contains(object value) => value is DbParameter candidate && _parameters.Contains(candidate);

    public override void CopyTo(Array array, int index)
    {
        ArgumentNullException.ThrowIfNull(array);

        foreach (DbParameter parameter in _parameters)
        {
            array.SetValue(parameter, index);
            index++;
        }
    }

    public override IEnumerator GetEnumerator() => ((IEnumerable)_parameters).GetEnumerator();

    public override int IndexOf(string parameterName)
    {
        ArgumentNullException.ThrowIfNull(parameterName);

        string lookup = NormalizeParameterName(parameterName);

        int index = _parameters.FindIndex(p => NormalizeParameterName(p.ParameterName!) == lookup);

        return index;
    }

    public override int IndexOf(object value) =>
        value is DbParameter candidate ? _parameters.IndexOf(candidate) : -1;

    public override void Insert(int index, object value)
    {
        DbParameter dbParameter = (DbParameter)value;
        _parameters.Insert(index, dbParameter);
    }

    public override void Remove(object value)
    {
        if (value is DbParameter candidate)
            _ = _parameters.Remove(candidate);
    }

    public override void RemoveAt(string parameterName)
    {
        int index = IndexOf(parameterName);
        RemoveAt(index);
    }

    public override void RemoveAt(int index) => _parameters.RemoveAt(index);

    protected override DbParameter GetParameter(int index) => _parameters[index];

    protected override DbParameter GetParameter(string parameterName)
    {
        int index = IndexOf(parameterName);
        if (index < 0) throw new ArgumentOutOfRangeException(nameof(parameterName));

        return _parameters[index];
    }

    protected override void SetParameter(int index, DbParameter value)
    {
        _parameters[index] = value;
    }

    protected override void SetParameter(string parameterName, DbParameter value)
    {
        int index = IndexOf(parameterName);
        if (index >= 0) _parameters[index] = value;
        else _ = Add(value);
    }

    private static string NormalizeParameterName(string parameterName)
    {
        return parameterName.Length > 0 && parameterName[0] == '@'
            ? parameterName[1..]
            : parameterName;
    }
}
