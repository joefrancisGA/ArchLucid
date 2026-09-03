using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-9 suggestion 86: builds optional Hasher B create-time pin commitment from run header pins.
/// </summary>
public static class RunHeaderCreateTimePinCommitmentFactory
{
    public static GoldenManifestCreateTimePinCommitment? TryFromRunHeader(RunRecord? header)
    {
        if (header is null)
            return null;

        if (string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson)
            && string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson)
            && (header.PinnedEvidencePackagePinsHashSha256 is null || header.PinnedEvidencePackagePinsHashSha256.Length == 0))
        {
            return null;
        }

        PinnedPolicyPackRow[] policyRows = [];

        if (!string.IsNullOrWhiteSpace(header.PinnedPolicyPackIdsJson))
        {
            if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(header.PinnedPolicyPackIdsJson, out policyRows))
            {
                throw new ConflictException(
                    "Hasher B blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
            }
        }

        PinnedEvidencePackageRow[] evidenceRows = [];

        if (!string.IsNullOrWhiteSpace(header.PinnedEvidencePackagePinsJson))
        {
            if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(header.PinnedEvidencePackagePinsJson, out evidenceRows))
            {
                throw new ConflictException(
                    "Hasher B blocked: evidence package pin JSON is not a valid PinnedEvidencePackageRow array.");
            }
        }

        string? evidenceHashHex = header.PinnedEvidencePackagePinsHashSha256 is { Length: > 0 } hash
            ? Convert.ToHexString(hash)
            : null;

        string? architectureVersionHashHex = header.PinnedArchitectureVersionContentHashSha256 is { Length: > 0 } avHash
            ? Convert.ToHexString(avHash)
            : null;

        string? knowledgeModelHashHex = header.PinnedKnowledgeModelContentHashSha256 is { Length: > 0 } kmHash
            ? Convert.ToHexString(kmHash)
            : null;

        return new GoldenManifestCreateTimePinCommitment(
            policyRows,
            evidenceRows,
            evidenceHashHex,
            architectureVersionHashHex,
            knowledgeModelHashHex);
    }
}
