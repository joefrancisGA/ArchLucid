using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class StaticRequestPayloadNormalizer : IConnectorNormalizer<StaticRequestPayload>
{
    public Task<NormalizedContextBatch> NormalizeAsync(
        StaticRequestPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);
        _ = ct;

        NormalizedContextBatch batch = new();

        if (!string.IsNullOrWhiteSpace(payload.Description))
        {
            string trimmed = payload.Description!.Trim();

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "Requirement",
                Name = "Primary Request",
                SourceType = "StaticRequest",
                SourceId = "description",
                Properties = new Dictionary<string, string> { ["text"] = trimmed.ToLowerInvariant() }
            });
        }

        return Task.FromResult(batch);
    }
}
