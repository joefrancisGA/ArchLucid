using System.Text;

using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Replay.Historical;

/// <summary>Read-only adapter for committed UTF-8 text artifacts already retained in an authorized authority bundle.</summary>
public sealed class AuthorityBundleHistoricalArtifactReader : IScopedHistoricalArtifactReader
{
    public const string ArchiveSchema = "authority-bundle-utf8-v1";
    private readonly IArtifactBundleRepository repository;
    private readonly HistoricalSourceAnchor source;
    private readonly ScopeContext scope;

    public AuthorityBundleHistoricalArtifactReader(IArtifactBundleRepository repository, HistoricalSourceAnchor source)
    {
        ArgumentNullException.ThrowIfNull(repository);
        if (!HistoricalReplayDescriptorValidation.ValidAnchor(source)
            || source.Scheme != HistoricalReplaySourceAnchors.AuthorityManifestScheme)
            throw new ArgumentException("A verified authority manifest anchor is required.", nameof(source));

        this.repository = repository;
        this.source = source;
        scope = new ScopeContext
        {
            TenantId = source.Run.Scope.TenantId, WorkspaceId = source.Run.Scope.WorkspaceId, ProjectId = source.Run.Scope.ProjectId,
        };
    }

    public async ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (identity.Run != source.Run)
            return new(identity, HistoricalArtifactAvailability.AccessDenied, null);
        // Full prompt/response evidence has its own retention and authorization rules. Never fall back to a bundle
        // or follow a trace blob locator when those original artifacts were not independently retained.
        if (identity.Schema != ArchiveSchema || identity.Role is HistoricalArtifactRole.AcceptedPrompt
                or HistoricalArtifactRole.AcceptedRawResponse
            || !Guid.TryParseExact(identity.ArtifactId, "D", out Guid id) || id == Guid.Empty)
            return new(identity, HistoricalArtifactAvailability.Incompatible, null);

        var archived = await repository.GetArtifactByIdAsync(scope, source.SourceRecordId, id, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        if (archived is null)
            return null;
        if (archived.ArtifactId != id || archived.RunId != source.Run.RunId || archived.ManifestId != source.SourceRecordId)
            return new(identity, HistoricalArtifactAvailability.AccessDenied, null);
        if (archived.Content is null)
            return new(identity, HistoricalArtifactAvailability.Missing, null);

        // The archive contract is UTF-8 over the committed text. Do not repair invalid surrogates.
        var utf8 = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true);
        try
        {
            if (utf8.GetByteCount(archived.Content) > HistoricalReplayDescriptorValidation.MaxArtifactBytes)
                return new(identity, HistoricalArtifactAvailability.Incompatible, null);

            return new(identity, HistoricalArtifactAvailability.Exact, new MemoryStream(utf8.GetBytes(archived.Content), writable: false));
        }
        catch (EncoderFallbackException)
        {
            return new(identity, HistoricalArtifactAvailability.Incompatible, null);
        }
    }
}
