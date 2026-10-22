using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     Builds an <see cref="ArchitectureKnowledgeModel" /> from structured intake on
///     <see cref="ArchitectureRequest" /> without requiring the four-agent review loop.
/// </summary>
public interface IArchitectureKnowledgeModelIntakeBuilder
{
    ArchitectureKnowledgeModel Build(ScopeContext scope, ArchitectureRequest request, string runId);
}
