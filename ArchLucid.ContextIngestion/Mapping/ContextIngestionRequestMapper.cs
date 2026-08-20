using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;

using System.Text.Json;

namespace ArchLucid.ContextIngestion.Mapping;

/// <summary>
///     Maps API / coordinator <see cref="ArchitectureRequest" /> into the ingestion pipeline model.
///     <see cref="ArchitectureRequest.SystemName" /> becomes <see cref="ContextIngestionRequest.ProjectId" />.
/// </summary>
public static class ContextIngestionRequestMapper
{
    public static ContextIngestionRequest FromArchitectureRequest(ArchitectureRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new ContextIngestionRequest
        {
            ArchitectureRequestId = request.RequestId,
            ProjectId = request.SystemName,
            Description = request.Description,
            InlineRequirements = request.InlineRequirements.ToList(),
            Documents = request.Documents
                .Select(d => new ContextDocumentReference
                {
                    Name = d.Name, ContentType = d.ContentType, Content = d.Content
                })
                .ToList(),
            PolicyReferences = request.PolicyReferences.ToList(),
            TopologyHints = request.TopologyHints.ToList(),
            SecurityBaselineHints = request.SecurityBaselineHints.ToList(),
            RequiredCapabilities = request.RequiredCapabilities.ToList(),
            Constraints = request.Constraints.ToList(),
            Assumptions = request.Assumptions.ToList(),
            ActorsJson = SerializeActors(request.DraftActors),
            QualityAttribute = request.QualityAttributeSnapshot,
            FailureModeNote = request.FailureModeNoteSnapshot,
            EffectiveModelAliasId = request.EffectiveModelAliasId,
            InfrastructureDeclarations = request.InfrastructureDeclarations
                .Select(x => new InfrastructureDeclarationReference
                {
                    Name = x.Name, Format = x.Format, Content = x.Content
                })
                .ToList()
        };
    }

    private static string? SerializeActors(IReadOnlyList<ActorDescriptor> actors)
    {
        if (actors is not { Count: > 0 })
            return null;

        return JsonSerializer.Serialize(actors);
    }
}
