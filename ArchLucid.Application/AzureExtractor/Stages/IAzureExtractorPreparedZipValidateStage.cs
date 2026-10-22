namespace ArchLucid.Application.AzureExtractor.Stages;

public interface IAzureExtractorPreparedZipValidateStage
{
    Task<AzureExtractorPreparedZipValidateResult> ValidateAsync(
        byte[] zipBytes, string safeName, Guid? runId, string? correlationId,
        long maxAcceptedZipBytes, CancellationToken ct);
}
