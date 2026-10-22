using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

public sealed class PlatformDocCorpusIndexerOptions
{
    public const string SectionPath = "Retrieval:PlatformDocs";

    public string DocsRootDirectory { get; set; } = "docs/architecture/adrs";

    /// <summary>
    ///     Additional allow-listed library markdown paths (repo-relative). GTM and pen-test paths are never indexed here.
    /// </summary>
    public List<string> AllowListedLibraryRelativePaths { get; set; } =
    [
        "docs/library/RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md",
        "docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md",
        "docs/library/V1_SCOPE.md",
    ];

    public int MaxDocuments { get; set; } = 32;

    public bool IndexOnStartup { get; set; } = true;
}
