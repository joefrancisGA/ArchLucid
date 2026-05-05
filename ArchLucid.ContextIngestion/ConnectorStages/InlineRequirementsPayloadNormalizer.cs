using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class InlineRequirementsPayloadNormalizer : IConnectorNormalizer<InlineRequirementsPayload>
{
    public Task<NormalizedContextBatch> NormalizeAsync(
        InlineRequirementsPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);
        _ = ct;

        NormalizedContextBatch batch = new();

        foreach (string requirement in payload.InlineRequirements)

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "Requirement",
                Name = requirement.Length > 80 ? requirement[..80] : requirement,
                SourceType = "InlineRequirement",
                SourceId = "inline",
                Properties = new Dictionary<string, string> { ["text"] = requirement }
            });


        return Task.FromResult(batch);
    }
}
