namespace ArchLucid.Api.Tests;

/// <summary>
///     Greenfield SQL host with <c>ArtifactLargePayload:BlobProvider=None</c> so chunked extractor upload returns 503.
/// </summary>
public sealed class GreenfieldSqlApiFactoryWithoutChunkStaging : GreenfieldSqlApiFactory
{
    /// <inheritdoc />
    protected override string ArtifactBlobProviderForIntegrationTests => "None";
}
