using ArchiForge.Contracts.Manifest;

namespace ArchiForge.Application.Summaries;

public interface IManifestSummaryService
{
    string GenerateMarkdown(GoldenManifest manifest, ManifestSummaryOptions? options = null);
}

