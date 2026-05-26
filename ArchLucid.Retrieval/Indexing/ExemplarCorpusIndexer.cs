using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     Indexes reference-architecture JSON under <c>templates/reference-architectures</c> and starter proof packs.
///     Style prior only — excluded from manifest hash (RAG-V1.1-001).
/// </summary>
public sealed class ExemplarCorpusIndexer(IOptionsMonitor<ExemplarCorpusIndexerOptions> options) : ICorpusSource
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IOptionsMonitor<ExemplarCorpusIndexerOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    public CorpusKind Kind => CorpusKind.ReferenceArchitecture;

    public Task<IReadOnlyList<RetrievalDocument>> BuildDocumentsAsync(CancellationToken ct)
    {
        ExemplarCorpusIndexerOptions opts = _options.CurrentValue;
        List<RetrievalDocument> documents = [];

        AppendFromDirectory(documents, ResolveDirectory(opts.ReferenceArchitecturesDirectory), ct);
        AppendFromDirectory(documents, ResolveDirectory(opts.StarterProofPacksDirectory), ct);

        int max = Math.Max(1, opts.MaxDocuments);

        return Task.FromResult<IReadOnlyList<RetrievalDocument>>(documents.Take(max).ToList());
    }

    private static void AppendFromDirectory(
        List<RetrievalDocument> documents,
        string directory,
        CancellationToken ct)
    {
        if (!Directory.Exists(directory))
            return;

        IEnumerable<string> files = Directory
            .EnumerateFiles(directory, "*.json", SearchOption.AllDirectories)
            .Where(static path => !path.Contains(".request.", StringComparison.OrdinalIgnoreCase))
            .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase);

        foreach (string path in files)
        {
            ct.ThrowIfCancellationRequested();

            RetrievalDocument? doc = TryBuildDocument(path);

            if (doc is not null)
                documents.Add(doc);
        }
    }

    private static RetrievalDocument? TryBuildDocument(string filePath)
    {
        string raw = File.ReadAllText(filePath);
        using JsonDocument doc = JsonDocument.Parse(raw);
        JsonElement root = doc.RootElement;

        string requestId = root.TryGetProperty("requestId", out JsonElement rid)
            ? rid.GetString() ?? Path.GetFileNameWithoutExtension(filePath)
            : Path.GetFileNameWithoutExtension(filePath);

        string systemName = root.TryGetProperty("systemName", out JsonElement sn)
            ? sn.GetString() ?? requestId
            : requestId;

        string description = root.TryGetProperty("description", out JsonElement desc)
            ? desc.GetString() ?? string.Empty
            : string.Empty;

        string content = raw.Trim();
        string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content)));
        DateTime createdUtc = File.GetLastWriteTimeUtc(filePath);

        return new RetrievalDocument
        {
            DocumentId = $"exemplar-{requestId}",
            TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            CorpusKind = CorpusKind.ReferenceArchitecture,
            SourceType = "ReferenceArchitectureExemplar",
            SourceId = requestId,
            Title = systemName,
            Content = string.IsNullOrWhiteSpace(description) ? content : $"{systemName}: {description}\n{content}",
            ContentHash = contentHash,
            CreatedUtc = createdUtc
        };
    }

    private static string ResolveDirectory(string configured)
    {
        if (string.IsNullOrWhiteSpace(configured))
            configured = "templates/reference-architectures";

        if (Path.IsPathRooted(configured))
            return configured;

        string relativeToBase = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configured));

        if (Directory.Exists(relativeToBase))
            return relativeToBase;

        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, configured.Replace('/', Path.DirectorySeparatorChar));

            if (Directory.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return relativeToBase;
    }
}
