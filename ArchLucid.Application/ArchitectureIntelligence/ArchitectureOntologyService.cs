using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureOntologyService : IArchitectureOntologyService
{
    public ArchitectureKnowledgeModel CreateEmptyModel(string tenantId, string? runId = null)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(tenantId));
        }

        DateTime now = TimeProvider.System.GetUtcNow().UtcDateTime;

        return new ArchitectureKnowledgeModel
        {
            ModelId = Guid.NewGuid().ToString("N"),
            TenantId = tenantId,
            RunId = runId,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
    }

    public ArchitectureKnowledgeModel UpsertElement(ArchitectureKnowledgeModel model, ArchitectureModelElement element)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(element);

        if (string.IsNullOrWhiteSpace(element.ElementId))
        {
            throw new ArgumentException("ElementId is required.", nameof(element));
        }

        int existingIndex = model.Elements.FindIndex(
            candidate => string.Equals(candidate.ElementId, element.ElementId, StringComparison.Ordinal));

        if (existingIndex >= 0)
        {
            model.Elements[existingIndex] = element;
        }
        else
        {
            model.Elements.Add(element);
        }

        model.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return model;
    }

    public IReadOnlyList<ArchitectureModelElement> GetElementsByKind(
        ArchitectureKnowledgeModel model,
        ArchitectureElementKind kind)
    {
        ArgumentNullException.ThrowIfNull(model);

        return model.Elements
            .Where(element => element.Kind == kind)
            .ToList();
    }
}
