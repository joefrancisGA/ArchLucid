using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IArchitectureOntologyService
{
    ArchitectureKnowledgeModel CreateEmptyModel(string tenantId, string? runId = null);

    ArchitectureKnowledgeModel UpsertElement(ArchitectureKnowledgeModel model, ArchitectureModelElement element);

    IReadOnlyList<ArchitectureModelElement> GetElementsByKind(
        ArchitectureKnowledgeModel model,
        ArchitectureElementKind kind);
}
