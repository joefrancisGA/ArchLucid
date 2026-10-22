using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Cli.Commands;

internal sealed class CitationIntegrityRunBundle
{
    public string RunId { get; init; } = string.Empty;

    public ArchitectureRunStatus Status { get; init; }

    public IReadOnlyList<AgentResult> AgentResults { get; init; } = [];
}

internal static class CitationIntegritySampler
{
    internal static IReadOnlyList<CitationIntegrityRunBundle> SelectDeterministic(
        IReadOnlyList<CitationIntegrityRunBundle> candidates,
        int sampleSize)
    {
        ArgumentNullException.ThrowIfNull(candidates);

        if (sampleSize <= 0)
            throw new ArgumentOutOfRangeException(nameof(sampleSize));

        List<CitationIntegrityRunBundle> committed = candidates
            .Where(static bundle => bundle.Status == ArchitectureRunStatus.Committed)
            .OrderBy(static bundle => bundle.RunId, StringComparer.Ordinal)
            .ToList();

        if (committed.Count <= sampleSize)
            return committed;

        List<CitationIntegrityRunBundle> selected = new(sampleSize);
        int stride = committed.Count / sampleSize;
        int remainder = committed.Count % sampleSize;

        if (stride < 1)
            stride = 1;

        int index = 0;

        while (selected.Count < sampleSize && index < committed.Count)
        {
            selected.Add(committed[index]);
            index += stride;

            if (remainder > 0)
            {
                index += 1;
                remainder -= 1;
            }
        }

        return selected
            .OrderBy(static bundle => bundle.RunId, StringComparer.Ordinal)
            .ToList();
    }
}

internal static class CitationIntegrityManifestLoader
{
    private static readonly JsonSerializerOptions JsonRead = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    internal static IReadOnlyList<CitationIntegrityRunBundle> Load(string manifestPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(manifestPath);

        string fullManifestPath = Path.GetFullPath(manifestPath);
        string manifestDirectory = Path.GetDirectoryName(fullManifestPath)
            ?? throw new InvalidOperationException($"Manifest directory not resolved: {fullManifestPath}");

        string json = File.ReadAllText(fullManifestPath);
        ManifestDocument? document = JsonSerializer.Deserialize<ManifestDocument>(json, JsonRead)
            ?? throw new InvalidOperationException($"Citation integrity manifest is empty: {fullManifestPath}");

        List<CitationIntegrityRunBundle> bundles = new();

        foreach (ManifestRunEntry entry in document.Runs)
        {
            List<AgentResult> results = new();

            foreach (string relativePath in entry.AgentResults)
            {
                string absolutePath = Path.GetFullPath(Path.Combine(manifestDirectory, relativePath));

                if (!File.Exists(absolutePath))
                    throw new FileNotFoundException("Agent result fixture not found.", absolutePath);

                string resultJson = File.ReadAllText(absolutePath);
                AgentResult? result = JsonSerializer.Deserialize<AgentResult>(resultJson, CliCommandShared.JsonDeserializeAgentResult)
                    ?? throw new InvalidOperationException($"Agent result could not be deserialized: {absolutePath}");

                results.Add(result);
            }

            ArchitectureRunStatus status = ParseStatus(entry.Status);

            bundles.Add(new CitationIntegrityRunBundle
            {
                RunId = entry.RunId,
                Status = status,
                AgentResults = results,
            });
        }

        return bundles;
    }

    private static ArchitectureRunStatus ParseStatus(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return ArchitectureRunStatus.Committed;

        if (Enum.TryParse(raw, ignoreCase: true, out ArchitectureRunStatus parsed))
            return parsed;

        throw new InvalidOperationException($"Unknown run status in citation integrity manifest: {raw}");
    }

    private sealed class ManifestDocument
    {
        public List<ManifestRunEntry> Runs { get; init; } = [];
    }

    private sealed class ManifestRunEntry
    {
        public string RunId { get; init; } = string.Empty;

        public string? Status { get; init; }

        public List<string> AgentResults { get; init; } = [];
    }
}
