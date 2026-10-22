namespace ArchLucid.Application.Documents;

/// <summary>Shared caps for advisory document text extraction at the API boundary.</summary>
public static class DocumentTextExtractionLimits
{
    public const long MaxUploadBytes = 10 * 1024 * 1024;

    public const int MaxOutputCharacters = 100_000;
}
