using System.Security.Cryptography;
using System.Text;

using ArchLucid.Retrieval.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>Indexes allow-listed platform ADR markdown under <c>docs/architecture/adrs</c>.</summary>
public sealed class PlatformDocCorpusIndexer(IOptionsMonitor<PlatformDocCorpusIndexerOptions> options) : ICorpusSource
{
    private readonly IOptionsMonitor<PlatformDocCorpusIndexerOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public CorpusKind Kind => CorpusKind.PlatformDoc;

    /// <inheritdoc />
    public Task<IReadOnlyList<RetrievalDocument>> BuildDocumentsAsync(CancellationToken ct)
    {
        PlatformDocCorpusIndexerOptions opts = _options.CurrentValue;
        string root = ResolveDocsRoot(opts.DocsRootDirectory);

        if (!Directory.Exists(root))
        {
            List<RetrievalDocument> libraryOnly = [];
            AppendDocumentsFromFiles(libraryOnly, EnumerateAllowListedLibraryFiles(opts, opts.MaxDocuments), ct);
            return Task.FromResult<IReadOnlyList<RetrievalDocument>>(libraryOnly);
        }

        List<RetrievalDocument> documents = [];
        IEnumerable<string> files = Directory
            .EnumerateFiles(root, "*.md", SearchOption.TopDirectoryOnly)
            .Where(static path => !IsDeniedFileName(Path.GetFileName(path)) && !IsDeniedRelativePath(path))
            .OrderBy(static path => path, StringComparer.OrdinalIgnoreCase)
            .Take(Math.Max(1, opts.MaxDocuments));

        AppendDocumentsFromFiles(documents, files, ct);

        int remaining = Math.Max(0, opts.MaxDocuments - documents.Count);

        if (remaining > 0)
        {
            IEnumerable<string> libraryFiles = EnumerateAllowListedLibraryFiles(opts, remaining);
            AppendDocumentsFromFiles(documents, libraryFiles, ct);
        }

        return Task.FromResult<IReadOnlyList<RetrievalDocument>>(documents);
    }

    private static IEnumerable<string> EnumerateAllowListedLibraryFiles(
        PlatformDocCorpusIndexerOptions opts,
        int maxFiles)
    {
        List<string> resolved = [];

        foreach (string relativePath in opts.AllowListedLibraryRelativePaths)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                continue;

            if (IsDeniedRelativePath(relativePath))
                continue;

            string absolute = ResolveDocsRoot(relativePath);

            if (!File.Exists(absolute))
                continue;

            resolved.Add(absolute);

            if (resolved.Count >= maxFiles)
                break;
        }

        return resolved.OrderBy(static path => path, StringComparer.OrdinalIgnoreCase);
    }

    private static void AppendDocumentsFromFiles(
        List<RetrievalDocument> documents,
        IEnumerable<string> files,
        CancellationToken ct)
    {
        foreach (string path in files)
        {
            ct.ThrowIfCancellationRequested();

            string content = File.ReadAllText(path);
            string title = Path.GetFileNameWithoutExtension(path);
            string hashInput = $"{title}|{content.Length}|{File.GetLastWriteTimeUtc(path):O}";
            string contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(hashInput)));

            documents.Add(new RetrievalDocument
            {
                DocumentId = $"platform-doc-{title}",
                TenantId = CorpusKindSentinels.PlatformSentinelTenantId,
                WorkspaceId = Guid.Empty,
                ProjectId = Guid.Empty,
                CorpusKind = CorpusKind.PlatformDoc,
                SourceType = "PlatformDoc",
                SourceId = title,
                Title = title,
                Content = content,
                ContentHash = contentHash,
                CreatedUtc = File.GetLastWriteTimeUtc(path),
            });
        }
    }

    private static bool IsDeniedRelativePath(string relativePath)
    {
        string normalized = relativePath.Replace('\\', '/');

        if (normalized.Contains("docs/go-to-market/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (normalized.Contains("docs/security/pen-test-summaries/", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool IsDeniedFileName(string fileName)
    {
        return fileName.Equals("README.md", StringComparison.OrdinalIgnoreCase)
               || fileName.Equals("template.md", StringComparison.OrdinalIgnoreCase)
               || fileName.Equals("adr-template-full.md", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveDocsRoot(string configured)
    {
        if (Path.IsPathRooted(configured))
            return configured;

        DirectoryInfo? current = new DirectoryInfo(AppContext.BaseDirectory);

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            string candidate = Path.Combine(current.FullName, configured.Replace('/', Path.DirectorySeparatorChar));

            if (Directory.Exists(candidate) || File.Exists(candidate))
                return candidate;

            current = current.Parent;
        }

        return Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, configured));
    }
}
