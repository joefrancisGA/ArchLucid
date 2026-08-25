using System.Security.Cryptography;
using System.Text;

using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Models.ConnectorPayloads;
using ArchLucid.ContextIngestion.Parsing;

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
        {
            if (string.IsNullOrWhiteSpace(requirement))
                continue;

            string trimmed = requirement.Trim();
            string canonicalRequirement = trimmed.ToLowerInvariant();

            batch.CanonicalObjects.Add(new CanonicalObject
            {
                ObjectType = "Requirement",
                Name = ContextIngestionStableLineNames.BuildDisplayName(canonicalRequirement),
                SourceType = "InlineRequirement",
                SourceId = StableRequirementSourceId(canonicalRequirement),
                Properties = new Dictionary<string, string> { ["text"] = canonicalRequirement }
            });
        }


        return Task.FromResult(batch);
    }

    private static string StableRequirementSourceId(string requirement)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(requirement));
        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
