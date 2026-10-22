namespace ArchLucid.Application.Evidence;

public sealed class ZipEvidenceExpanderOptions
{
    public const string SectionName = "ArchLucid:Evidence:ZipExpansion";

    public long MaxUncompressedSizeBytes { get; set; } = 500L * 1024 * 1024;

    public IReadOnlyList<string> AllowedExtensions { get; set; } =
    [
        ".md", ".txt", ".json", ".yaml", ".yml", ".xml", ".pdf", ".png", ".jpg", ".jpeg"
    ];
}