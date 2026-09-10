using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.KnowledgeGraph.WafTradeoff;

public sealed class WafTradeoffCatalog : IWafTradeoffCatalog
{
    private const string EmbeddedResourceName = "ArchLucid.KnowledgeGraph.Data.WafTradeoffCatalog.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly Dictionary<string, WafTradeoffCatalogEntry> _byKey;

    public WafTradeoffCatalog()
        : this(LoadEmbeddedEntries())
    {
    }

    internal WafTradeoffCatalog(IReadOnlyList<WafTradeoffCatalogEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        WafTradeoffCatalogValidator.Validate(entries);

        List<WafTradeoffCatalogEntry> normalizedEntries = NormalizeDetectionSignatures(entries);
        _byKey = BuildIndex(normalizedEntries);
        All = normalizedEntries;
    }

    public IReadOnlyList<WafTradeoffCatalogEntry> All { get; }

    public WafTradeoffCatalogEntry? FindByKey(string mechanismKey)
    {
        if (string.IsNullOrWhiteSpace(mechanismKey))
            return null;

        return _byKey.TryGetValue(mechanismKey, out WafTradeoffCatalogEntry? entry) ? entry : null;
    }

    public WafTradeoffCatalogEntry? FindCounterfactual(string mechanismKey)
    {
        WafTradeoffCatalogEntry? entry = FindByKey(mechanismKey);

        if (entry is null || string.IsNullOrWhiteSpace(entry.CounterfactualKey))
            return null;

        return FindByKey(entry.CounterfactualKey);
    }

    private static IReadOnlyList<WafTradeoffCatalogEntry> LoadEmbeddedEntries()
    {
        Assembly assembly = typeof(WafTradeoffCatalog).Assembly;
        using Stream? stream = assembly.GetManifestResourceStream(EmbeddedResourceName);

        if (stream is null)
            throw new InvalidOperationException($"Embedded WAF tradeoff catalog not found: {EmbeddedResourceName}");

        WafTradeoffCatalogDocument? document = JsonSerializer.Deserialize<WafTradeoffCatalogDocument>(stream, JsonOptions);

        if (document?.Entries is null || document.Entries.Count == 0)
            throw new InvalidOperationException("WAF tradeoff catalog has no entries.");

        return document.Entries;
    }

    private static Dictionary<string, WafTradeoffCatalogEntry> BuildIndex(IReadOnlyList<WafTradeoffCatalogEntry> entries)
    {
        Dictionary<string, WafTradeoffCatalogEntry> byKey =
            new(entries.Count, StringComparer.OrdinalIgnoreCase);

        foreach (WafTradeoffCatalogEntry entry in entries)
            byKey[entry.MechanismKey] = entry;

        return byKey;
    }

    private static List<WafTradeoffCatalogEntry> NormalizeDetectionSignatures(
        IReadOnlyList<WafTradeoffCatalogEntry> entries)
    {
        List<WafTradeoffCatalogEntry> normalizedEntries = new(entries.Count);

        foreach (WafTradeoffCatalogEntry entry in entries)
        {
            normalizedEntries.Add(new WafTradeoffCatalogEntry
            {
                MechanismKey = entry.MechanismKey,
                MechanismLabel = entry.MechanismLabel,
                GainedPillar = entry.GainedPillar,
                SacrificedPillar = entry.SacrificedPillar,
                DetectionSignatures = entry.DetectionSignatures
                    .Select(static signature => signature.ToLowerInvariant())
                    .ToList(),
                CounterfactualKey = entry.CounterfactualKey,
                DefaultConsequence = entry.DefaultConsequence,
                DefaultReversibility = entry.DefaultReversibility,
            });
        }

        return normalizedEntries;
    }

    private sealed class WafTradeoffCatalogDocument
    {
        public string Version { get; set; } = null!;

        public List<WafTradeoffCatalogEntry> Entries { get; set; } = [];
    }
}
