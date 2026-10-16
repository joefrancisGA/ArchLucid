using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Re-pins the run's architecture version after κ is materialized so commit κ checks match the saved model.
/// </summary>
public interface IArchitectureVersionKnowledgeModelPinSync
{
    /// <summary>
    ///     Advances the pinned <c>ArchitectureVersionId</c> when saved knowledge-model content differs from the
    ///     create-time intake hash (review create pins without κ; closed-loop persist writes κ later).
    /// </summary>
    Task SyncPinnedVersionToSavedModelAsync(
        ScopeContext scope,
        RunRecord run,
        ArchitectureKnowledgeModel knowledgeModel,
        CancellationToken cancellationToken = default);
}
