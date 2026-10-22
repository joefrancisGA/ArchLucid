using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.KnowledgeGraph.Interfaces;

/// <summary>
///     Typed morphism κ → Γ: projects a persisted <see cref="ArchitectureKnowledgeModel" />
///     into a <see cref="GraphSnapshot" /> for the review evaluation kernel.
/// </summary>
public interface IArchitectureKnowledgeModelGraphProjector
{
    GraphSnapshot Project(
        ArchitectureKnowledgeModel model,
        ContextSnapshot contextSnapshot,
        Guid runId);
}
