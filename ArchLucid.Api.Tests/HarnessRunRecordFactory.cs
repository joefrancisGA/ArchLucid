using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Tests;

/// <summary>Maps wire run payloads into persistence <see cref="RunRecord" /> pin fields for manifest fingerprint tests.</summary>
public static class HarnessRunRecordFactory
{
    public static RunRecord FromRunDto(RunDto run)
    {
        ArgumentNullException.ThrowIfNull(run);

        string? pinnedEvidencePackagePinsHashSha256 = run.PinnedEvidencePackagePinsHashSha256;

        return new RunRecord
        {
            PinnedPolicyPackIdsJson = run.PinnedPolicyPackIdsJson,
            PinnedEvidencePackagePinsJson = run.PinnedEvidencePackagePinsJson,
            PinnedEvidencePackagePinsHashSha256 =
                !string.IsNullOrWhiteSpace(pinnedEvidencePackagePinsHashSha256)
                ? Convert.FromBase64String(pinnedEvidencePackagePinsHashSha256)
                : null,
        };
    }
}
