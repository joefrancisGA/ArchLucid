using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Loads κ as-of a run (run-scoped row first) and saves append-only versions that advance
///     <see cref="ArchitectureIdentityRecord.CurrentModelId" />.
/// </summary>
public interface IArchitectureKnowledgeModelAccess
{
    Task<ArchitectureKnowledgeModel?> GetForRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);

    Task SaveForRunAsync(
        ScopeContext scope,
        Guid runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken = default);
}
