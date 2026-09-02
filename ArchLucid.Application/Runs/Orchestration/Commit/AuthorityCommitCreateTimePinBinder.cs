using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Wave-6 suggestion 57: copies create-time pin rows from the run header onto the manifest before hashing.
/// </summary>
public static class AuthorityCommitCreateTimePinBinder
{
    public static void BindFromRunHeader(ManifestDocument manifest, RunRecord runRecord)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(runRecord);

        manifest.CreateTimePolicyPackPins = [];

        if (!string.IsNullOrWhiteSpace(runRecord.PinnedPolicyPackIdsJson)
            && RunHeaderPinDeserializer.TryDeserializePolicyPackRows(
                runRecord.PinnedPolicyPackIdsJson,
                out PinnedPolicyPackRow[] policyRows))
        {
            manifest.CreateTimePolicyPackPins.AddRange(policyRows);
        }

        manifest.CreateTimeEvidencePackagePins = [];

        if (!string.IsNullOrWhiteSpace(runRecord.PinnedEvidencePackagePinsJson)
            && RunHeaderPinDeserializer.TryDeserializeEvidenceRows(
                runRecord.PinnedEvidencePackagePinsJson,
                out PinnedEvidencePackageRow[] evidenceRows))
        {
            manifest.CreateTimeEvidencePackagePins.AddRange(evidenceRows);
        }
    }
}
