namespace ArchLucid.Application.AzureExtractor.Stages;

public sealed class AzureExtractorPreparedZipValidateResult
{
    public AzureExtractorIngestResult? Failure { get; init; }
    public AzureExtractorPreparedZipValidatedContext? Context { get; init; }
}
