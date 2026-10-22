using System.Security.Cryptography;
using System.Text;

using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;

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
        {
            if (string.IsNullOrWhiteSpace(hint))
                continue;

            string trimmed = hint.Trim();
            string canonicalHint = trimmed.ToLowerInvariant();

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectId = ContextIngestionStableLineNames.StableObjectId("SecurityBaseline", canonicalHint),
                ObjectType = "SecurityBaseline",
                Name = canonicalHint,
                SourceType = "SecurityBaselineHint",
                SourceId = StableHintSourceId(canonicalHint),
                Properties = new Dictionary<string, string> { ["text"] = canonicalHint, ["status"] = "declared" }
            });
        }


        return Task.FromResult(batch);
    }

    private static string StableHintSourceId(string hint)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(hint));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
