using System.Data;

using ArchiForge.ArtifactSynthesis.Models;
using ArchiForge.Core.Scoping;

namespace ArchiForge.ArtifactSynthesis.Interfaces;

public interface IArtifactBundleRepository
{
    Task SaveAsync(
        ArtifactBundle bundle,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<ArtifactBundle?> GetByManifestIdAsync(ScopeContext scope, Guid manifestId, CancellationToken ct);
}
