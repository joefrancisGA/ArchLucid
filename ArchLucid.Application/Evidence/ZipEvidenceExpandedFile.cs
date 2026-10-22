namespace ArchLucid.Application.Evidence;

public sealed class ZipEvidenceExpandedFile
{
    public required string FileName { get; init; }

    public required byte[] Content { get; init; }
}