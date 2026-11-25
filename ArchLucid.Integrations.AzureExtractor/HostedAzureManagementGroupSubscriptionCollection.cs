using System.Collections;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>Discovered subscription IDs with explicit collection completeness.</summary>
public sealed class HostedAzureManagementGroupSubscriptionCollection(
    IReadOnlyList<string> subscriptionIds,
    bool partialCollection) : IReadOnlyList<string>
{
    public bool PartialCollection { get; } = partialCollection;
    public int Count => subscriptionIds.Count;
    public string this[int index] => subscriptionIds[index];
    public IEnumerator<string> GetEnumerator() => subscriptionIds.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
