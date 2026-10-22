using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAuthorityClosedLoopStrengtheningPass
{
    Task TryStrengthenManifestAsync(
        ScopeContext scope,
        RunRecord run,
        ContextIngestionRequest request,
        ManifestDocument manifest,
        CancellationToken cancellationToken);
}
