using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <summary>
///     Unit-of-work-aware persistence helpers shared by authority pipeline stage handlers.
/// </summary>
public interface IAuthorityPipelineStagePersistence
{
    Task UpdateRunAsync(RunRecord run, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task SaveContextAsync(ContextSnapshot snapshot, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task SaveGraphAsync(
        GraphSnapshot snapshot,
        ScopeContext scope,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken);

    Task SaveFindingsAsync(FindingsSnapshot snapshot, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task SaveTraceAsync(DecisionTraceDto trace, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task SaveManifestAsync(ManifestDocument manifest, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);

    Task SaveArtifactBundleAsync(ArtifactBundle bundle, IArchLucidUnitOfWork unitOfWork, CancellationToken cancellationToken);
}
