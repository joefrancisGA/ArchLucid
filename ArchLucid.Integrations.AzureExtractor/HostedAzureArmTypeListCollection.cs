using System.Collections;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>Type-specific ARM observations with explicit pagination completeness.</summary>
internal sealed class HostedAzureArmTypeListCollection(
    IReadOnlyList<HostedAzureArmResourceRecord> resources,
    bool partialCollection) : IReadOnlyList<HostedAzureArmResourceRecord>
{
    public bool PartialCollection { get; } = partialCollection;
    public int Count => resources.Count;
    public HostedAzureArmResourceRecord this[int index] => resources[index];
    public IEnumerator<HostedAzureArmResourceRecord> GetEnumerator() => resources.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
