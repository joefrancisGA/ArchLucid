using System.Security.Cryptography;
using System.Text;

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
                SourceId = StableRequirementSourceId(requirement),
                Properties = new Dictionary<string, string> { ["text"] = requirement }
            });


        return Task.FromResult(batch);
    }

    private static string StableRequirementSourceId(string requirement)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(requirement.Trim()));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
