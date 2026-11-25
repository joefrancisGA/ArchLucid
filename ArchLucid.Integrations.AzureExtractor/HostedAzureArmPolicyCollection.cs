using System.Collections;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>Policy observations with explicit enumeration completeness.</summary>
internal sealed class HostedAzureArmPolicyCollection<T>(
    IReadOnlyList<T> values,
    bool partialCollection) : IReadOnlyList<T>
{
    public bool PartialCollection { get; } = partialCollection;
    public int Count => values.Count;
    public T this[int index] => values[index];
    public IEnumerator<T> GetEnumerator() => values.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
