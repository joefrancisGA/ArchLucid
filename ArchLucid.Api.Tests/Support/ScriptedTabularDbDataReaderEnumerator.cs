using System.Collections;

namespace ArchLucid.Api.Tests.Support;

internal sealed class ScriptedTabularDbDataReaderEnumerator : IEnumerator
{
    private readonly ScriptedTabularDbDataReader _reader;

    public ScriptedTabularDbDataReaderEnumerator(ScriptedTabularDbDataReader reader) =>
        _reader = reader ?? throw new ArgumentNullException(nameof(reader));

    public object Current => _reader.IsClosed ? throw new InvalidOperationException() : _reader;

    public bool MoveNext() => !_reader.IsClosed && _reader.Read();

    public void Reset() => throw new NotSupportedException();
}
