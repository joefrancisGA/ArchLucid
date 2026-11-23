using System.Data;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Scoping;

namespace ArchLucid.ArtifactSynthesis.Repositories;

public class InMemoryArtifactBundleRepository : IArtifactBundleRepository
{
    private const int MaxEntries = 500;

    private readonly Lock _lock = new();
    private readonly List<ArtifactBundle> _store = [];

    public Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(bundle);
        ct.ThrowIfCancellationRequested();

        _ = connection;
        _ = transaction;

        lock (_lock)
        {
            // Persist a detached snapshot rather than a caller-owned mutable object.
            _store.Add(CloneBundle(bundle, loadArtifactBodies: true));
            if (_store.Count > MaxEntries)
                _store.RemoveRange(0, _store.Count - MaxEntries);
        }

        return Task.CompletedTask;
    }

    public Task<ArtifactBundle?> GetByManifestIdAsync(
        ScopeContext scope,
        Guid manifestId,
        bool loadArtifactBodies,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        lock (_lock)
        {
            ArtifactBundle? result = _store
                .Where(x => x.ManifestId == manifestId
                    && x.TenantId == scope.TenantId
                    && x.WorkspaceId == scope.WorkspaceId
                    && x.ProjectId == scope.ProjectId)
                .OrderBy(x => x.CreatedUtc)
                .LastOrDefault();

            return Task.FromResult(result is null ? null : CloneBundle(result, loadArtifactBodies));
        }
    }

    public Task<ArtifactBundle?> GetByBundleIdInScopeAsync(
        ScopeContext scope,
        Guid bundleId,
        bool loadArtifactBodies,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();

        lock (_lock)
        {
            ArtifactBundle? result = _store.LastOrDefault(x =>
                x.BundleId == bundleId
                && x.TenantId == scope.TenantId
                && x.WorkspaceId == scope.WorkspaceId
                && x.ProjectId == scope.ProjectId);

            return Task.FromResult(result is null ? null : CloneBundle(result, loadArtifactBodies));
        }
    }

    public async Task<SynthesizedArtifact?> GetArtifactByIdAsync(
        ScopeContext scope,
        Guid manifestId,
        Guid artifactId,
        CancellationToken ct)
    {
        ArtifactBundle? bundle = await GetByManifestIdAsync(scope, manifestId, loadArtifactBodies: true, ct);
        return bundle?.Artifacts.FirstOrDefault(x => x.ArtifactId == artifactId);
    }

    private static ArtifactBundle CloneBundle(ArtifactBundle source, bool loadArtifactBodies) =>
        new()
        {
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            BundleId = source.BundleId,
            RunId = source.RunId,
            ManifestId = source.ManifestId,
            CreatedUtc = source.CreatedUtc,
            Status = source.Status,
            Trace = CloneTrace(source.Trace),
            Artifacts = source.Artifacts.ConvertAll(artifact => CloneArtifact(artifact, loadArtifactBodies))
        };

    private static SynthesisTrace CloneTrace(SynthesisTrace source) =>
        new()
        {
            TraceId = source.TraceId,
            RunId = source.RunId,
            ManifestId = source.ManifestId,
            CreatedUtc = source.CreatedUtc,
            GeneratorsUsed = [.. source.GeneratorsUsed],
            SourceDecisionIds = [.. source.SourceDecisionIds],
            Notes = [.. source.Notes]
        };

    private static SynthesizedArtifact CloneArtifact(SynthesizedArtifact source, bool loadArtifactBodies) =>
        new()
        {
            ArtifactId = source.ArtifactId,
            RunId = source.RunId,
            ManifestId = source.ManifestId,
            CreatedUtc = source.CreatedUtc,
            ArtifactType = source.ArtifactType,
            Name = source.Name,
            Format = source.Format,
            Content = loadArtifactBodies ? source.Content : string.Empty,
            ContentHash = source.ContentHash,
            Status = source.Status,
            Metadata = new Dictionary<string, string>(source.Metadata, source.Metadata.Comparer),
            ContributingDecisionIds = [.. source.ContributingDecisionIds]
        };
}
