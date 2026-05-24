using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Indexing;

public sealed class PlatformDocCorpusIndexerOptions
{
    public const string SectionPath = "Retrieval:PlatformDocs";

    public string DocsRootDirectory { get; set; } = "docs/architecture/adrs";

    public int MaxDocuments { get; set; } = 32;

    public bool IndexOnStartup { get; set; } = true;
}
