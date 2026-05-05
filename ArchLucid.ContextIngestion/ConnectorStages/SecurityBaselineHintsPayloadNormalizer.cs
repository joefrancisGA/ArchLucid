using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;

namespace ArchLucid.ContextIngestion.ConnectorStages;

public sealed class SecurityBaselineHintsPayloadNormalizer : IConnectorNormalizer<SecurityBaselineHintsPayload>
{
    public Task<NormalizedContextBatch> NormalizeAsync(
        SecurityBaselineHintsPayload payload,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(payload);
        _ = ct;

        NormalizedContextBatch batch = new();

        foreach (string hint in payload.SecurityBaselineHints)

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "SecurityBaseline",
                Name = hint,
                SourceType = "SecurityBaselineHint",
                SourceId = "security-hint",
                Properties = new Dictionary<string, string> { ["text"] = hint, ["status"] = "declared" }
            });


        return Task.FromResult(batch);
    }
}
