namespace ArchLucid.Application.Evidence;

public sealed class ZipEvidenceExpansionResult
{
    public IReadOnlyList<ZipEvidenceExpandedFile> Files { get; init; } = [];

    public IReadOnlyList<string> SkippedEntries { get; init; } = [];
}