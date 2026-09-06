namespace ArchLucid.Decisioning.Risk;

internal sealed class ManifestTradeoffScanContext
{
    public ManifestTradeoffScanContext(string manifestText, IReadOnlyDictionary<string, int> dependencyFanInByNodeId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestText);

        ManifestText = manifestText;
        DependencyFanInByNodeId = dependencyFanInByNodeId;
    }

    public string ManifestText { get; }

    public IReadOnlyDictionary<string, int> DependencyFanInByNodeId { get; }

    public bool ContainsSignature(string signature) =>
        ManifestText.Contains(signature, StringComparison.OrdinalIgnoreCase);
}
