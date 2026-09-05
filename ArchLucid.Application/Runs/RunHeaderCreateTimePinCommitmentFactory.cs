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

        return TryFromPinJson(
            header.PinnedPolicyPackIdsJson,
            header.PinnedEvidencePackagePinsJson,
            header.PinnedEvidencePackagePinsHashSha256,
            header.PinnedArchitectureVersionContentHashSha256,
            header.PinnedKnowledgeModelContentHashSha256,
            header.PinnedFocusedPilotModeEnabled,
            header.PinnedFocusedPilotCloudProvider);
    }

    /// <summary>
    ///     Builds Hasher B create-time pin commitment from pin JSON fields without requiring a Persistence run header.
    /// </summary>
    public static GoldenManifestCreateTimePinCommitment? TryFromPinJson(
        string? pinnedPolicyPackIdsJson,
        string? pinnedEvidencePackagePinsJson,
        byte[]? pinnedEvidencePackagePinsHashSha256,
        byte[]? pinnedArchitectureVersionContentHashSha256 = null,
        byte[]? pinnedKnowledgeModelContentHashSha256 = null,
        bool? pinnedFocusedPilotModeEnabled = null,
        int? pinnedFocusedPilotCloudProvider = null)
    {
        if (string.IsNullOrWhiteSpace(pinnedPolicyPackIdsJson)
            && string.IsNullOrWhiteSpace(pinnedEvidencePackagePinsJson)
            && (pinnedEvidencePackagePinsHashSha256 is null || pinnedEvidencePackagePinsHashSha256.Length == 0))
        {
            return null;
        }

        PinnedPolicyPackRow[] policyRows = [];

        if (!string.IsNullOrWhiteSpace(pinnedPolicyPackIdsJson))
        {
            if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(pinnedPolicyPackIdsJson, out policyRows))
            {
                throw new ConflictException(
                    "Hasher B blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
            }
        }

        PinnedEvidencePackageRow[] evidenceRows = [];

        if (!string.IsNullOrWhiteSpace(pinnedEvidencePackagePinsJson))
        {
            if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(pinnedEvidencePackagePinsJson, out evidenceRows))
            {
                throw new ConflictException(
                    "Hasher B blocked: evidence package pin JSON is not a valid PinnedEvidencePackageRow array.");
            }
        }

        string? evidenceHashHex = pinnedEvidencePackagePinsHashSha256 is { Length: > 0 } hash
            ? Convert.ToHexString(hash)
            : null;

        string? architectureVersionHashHex = pinnedArchitectureVersionContentHashSha256 is { Length: > 0 } avHash
            ? Convert.ToHexString(avHash)
            : null;

        string? knowledgeModelHashHex = pinnedKnowledgeModelContentHashSha256 is { Length: > 0 } kmHash
            ? Convert.ToHexString(kmHash)
            : null;

        return new GoldenManifestCreateTimePinCommitment(
            policyRows,
            evidenceRows,
            evidenceHashHex,
            architectureVersionHashHex,
            knowledgeModelHashHex,
            pinnedFocusedPilotModeEnabled,
            pinnedFocusedPilotCloudProvider);
    }
}
