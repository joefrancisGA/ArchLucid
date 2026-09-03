using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.AzureExtractor.Stages;

public sealed class AzureExtractorPreparedZipValidatedContext
{
    public required byte[] ZipBytes { get; init; }
    public required string SafeName { get; init; }
    public required AzureExtractorNormalizedManifest Manifest { get; init; }
    public required ScopeContext Scope { get; init; }
    public required string Actor { get; init; }
    public Guid? RunId { get; init; }
    public string? CorrelationId { get; init; }
}
