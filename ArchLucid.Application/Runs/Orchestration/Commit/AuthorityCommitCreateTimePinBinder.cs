using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Wave-6 suggestion 57 / wave-7 suggestion 69: copies create-time pin rows and hash digests onto the manifest before hashing.
/// </summary>
public static class AuthorityCommitCreateTimePinBinder
{
    public static void BindFromRunHeader(ManifestDocument manifest, RunRecord runRecord)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(runRecord);

        manifest.CreateTimePolicyPackPins = [];

        if (!string.IsNullOrWhiteSpace(runRecord.PinnedPolicyPackIdsJson))
        {
            if (!RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                    runRecord.PinnedPolicyPackIdsJson,
                    out PinnedPolicyPackRow[] policyRows))
            {
                throw new ConflictException(
                    "Commit blocked: policy pack pin JSON is not a valid PinnedPolicyPackRow array.");
            }

            manifest.CreateTimePolicyPackPins.AddRange(policyRows);
        }

        manifest.CreateTimeEvidencePackagePins = [];
        manifest.CreateTimeEvidencePackagePinsHashSha256 = null;

        if (string.IsNullOrWhiteSpace(runRecord.PinnedEvidencePackagePinsJson))
            return;

        if (!RunHeaderPinDeserializer.TryDeserializeEvidenceRows(
                runRecord.PinnedEvidencePackagePinsJson,
                out PinnedEvidencePackageRow[] evidenceRows))
        {
            throw new ConflictException(
                "Commit blocked: evidence package pin JSON is not a valid PinnedEvidencePackageRow array.");
        }

        manifest.CreateTimeEvidencePackagePins.AddRange(evidenceRows);

        if (runRecord.PinnedEvidencePackagePinsHashSha256 is { Length: > 0 })
        {
            manifest.CreateTimeEvidencePackagePinsHashSha256 =
                Convert.ToHexString(runRecord.PinnedEvidencePackagePinsHashSha256);
        }

        if (runRecord.PinnedArchitectureVersionContentHashSha256 is { Length: > 0 })
        {
            manifest.CreateTimeArchitectureVersionContentHashSha256 =
                Convert.ToHexString(runRecord.PinnedArchitectureVersionContentHashSha256);
        }

        if (runRecord.PinnedKnowledgeModelContentHashSha256 is { Length: > 0 })
        {
            manifest.CreateTimeKnowledgeModelContentHashSha256 =
                Convert.ToHexString(runRecord.PinnedKnowledgeModelContentHashSha256);
        }

        manifest.CreateTimeFocusedPilotModeEnabled = runRecord.PinnedFocusedPilotModeEnabled;
        manifest.CreateTimeFocusedPilotCloudProvider = runRecord.PinnedFocusedPilotCloudProvider;
    }
}
