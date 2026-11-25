using System.Collections;

namespace ArchLucid.Integrations.AzureExtractor;

internal sealed class HostedAzureAdfCollection<T>(IReadOnlyList<T> values, bool partialCollection) : IReadOnlyList<T>
{
    public bool PartialCollection { get; } = partialCollection;
    public int Count => values.Count;
    public T this[int index] => values[index];
    public IEnumerator<T> GetEnumerator() => values.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
