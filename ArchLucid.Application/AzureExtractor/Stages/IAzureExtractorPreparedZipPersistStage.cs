namespace ArchLucid.Application.AzureExtractor.Stages;

public interface IAzureExtractorPreparedZipPersistStage
{
    Task<AzureExtractorIngestResult> PersistAsync(AzureExtractorPreparedZipValidatedContext context, CancellationToken ct);
}
