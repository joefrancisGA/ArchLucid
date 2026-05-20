namespace ArchLucid.Application.Evidence;

public interface IZipEvidenceExpanderService
{
    ZipEvidenceExpansionResult Expand(Stream zipStream, string sourceArchiveName);
}