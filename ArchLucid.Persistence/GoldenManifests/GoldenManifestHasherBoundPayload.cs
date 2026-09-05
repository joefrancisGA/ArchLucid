using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.GoldenManifests;

/// <summary>
///     Hasher A fields that are not in the original twelve JSON columns on
///     <c>dbo.GoldenManifests</c> / <c>dbo.SignedReviewRecords</c>.
///     Persist them so sealed <see cref="ManifestDocument.ManifestHash"/> still verifies after hydrate.
/// </summary>
internal sealed class GoldenManifestHasherBoundPayload
{
    public Guid? ArchitectureVersionId
    {
        get;
        init;
    }

    public List<PinnedPolicyPackRow> CreateTimePolicyPackPins
    {
        get;
        init;
    } = [];

    public List<PinnedEvidencePackageRow> CreateTimeEvidencePackagePins
    {
        get;
        init;
    } = [];

    public string? CreateTimeEvidencePackagePinsHashSha256
    {
        get;
        init;
    }

    public string? CreateTimeArchitectureVersionContentHashSha256
    {
        get;
        init;
    }

    public string? CreateTimeKnowledgeModelContentHashSha256
    {
        get;
        init;
    }

    public bool? CreateTimeFocusedPilotModeEnabled
    {
        get;
        init;
    }

    public int? CreateTimeFocusedPilotCloudProvider
    {
        get;
        init;
    }

    public string? CreateTimePackageOrigin
    {
        get;
        init;
    }

    public string? CreateTimeArchitectureRequestId
    {
        get;
        init;
    }

    public int? CreateTimeStructuralExecutionMode
    {
        get;
        init;
    }

    public string? CreateTimePilotAoaiDeploymentSnapshot
    {
        get;
        init;
    }

    public PolicySection? Policy
    {
        get;
        init;
    }

    public FeasibilityVerdict? FeasibilityVerdict
    {
        get;
        init;
    }

    public CommittedEffectiveGovernanceSnapshotDescriptor? EffectiveGovernanceAtCommit
    {
        get;
        init;
    }

    public CommittedReviewStandardsSnapshotDescriptor? ReviewStandardsAtCommit
    {
        get;
        init;
    }

    public List<CommittedArtifactInventoryEntry> CommittedArtifactInventory
    {
        get;
        init;
    } = [];

    public string? CommittedDecisionReceiptHashSha256
    {
        get;
        init;
    }

    public static GoldenManifestHasherBoundPayload FromDocument(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return new GoldenManifestHasherBoundPayload
        {
            ArchitectureVersionId = manifest.ArchitectureVersionId,
            CreateTimePolicyPackPins = [.. manifest.CreateTimePolicyPackPins],
            CreateTimeEvidencePackagePins = [.. manifest.CreateTimeEvidencePackagePins],
            CreateTimeEvidencePackagePinsHashSha256 = manifest.CreateTimeEvidencePackagePinsHashSha256,
            CreateTimeArchitectureVersionContentHashSha256 = manifest.CreateTimeArchitectureVersionContentHashSha256,
            CreateTimeKnowledgeModelContentHashSha256 = manifest.CreateTimeKnowledgeModelContentHashSha256,
            CreateTimeFocusedPilotModeEnabled = manifest.CreateTimeFocusedPilotModeEnabled,
            CreateTimeFocusedPilotCloudProvider = manifest.CreateTimeFocusedPilotCloudProvider,
            CreateTimePackageOrigin = manifest.CreateTimePackageOrigin,
            CreateTimeArchitectureRequestId = manifest.CreateTimeArchitectureRequestId,
            CreateTimeStructuralExecutionMode = manifest.CreateTimeStructuralExecutionMode,
            CreateTimePilotAoaiDeploymentSnapshot = manifest.CreateTimePilotAoaiDeploymentSnapshot,
            Policy = manifest.Policy,
            FeasibilityVerdict = manifest.FeasibilityVerdict,
            EffectiveGovernanceAtCommit = manifest.EffectiveGovernanceAtCommit,
            ReviewStandardsAtCommit = manifest.ReviewStandardsAtCommit,
            CommittedArtifactInventory = [.. manifest.CommittedArtifactInventory],
            CommittedDecisionReceiptHashSha256 = manifest.CommittedDecisionReceiptHashSha256,
        };
    }

    public static string SerializeFromDocument(ManifestDocument manifest) =>
        JsonEntitySerializer.Serialize(FromDocument(manifest));

    public static void ApplyJsonToDocument(string? hasherBoundJson, ManifestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        if (string.IsNullOrWhiteSpace(hasherBoundJson))
            return;

        GoldenManifestHasherBoundPayload payload =
            JsonEntitySerializer.Deserialize<GoldenManifestHasherBoundPayload>(hasherBoundJson);
        payload.ApplyTo(document);
    }

    public void ApplyTo(ManifestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        document.ArchitectureVersionId = ArchitectureVersionId;
        document.CreateTimePolicyPackPins = [.. CreateTimePolicyPackPins ?? []];
        document.CreateTimeEvidencePackagePins = [.. CreateTimeEvidencePackagePins ?? []];
        document.CreateTimeEvidencePackagePinsHashSha256 = CreateTimeEvidencePackagePinsHashSha256;
        document.CreateTimeArchitectureVersionContentHashSha256 = CreateTimeArchitectureVersionContentHashSha256;
        document.CreateTimeKnowledgeModelContentHashSha256 = CreateTimeKnowledgeModelContentHashSha256;
        document.CreateTimeFocusedPilotModeEnabled = CreateTimeFocusedPilotModeEnabled;
        document.CreateTimeFocusedPilotCloudProvider = CreateTimeFocusedPilotCloudProvider;
        document.CreateTimePackageOrigin = CreateTimePackageOrigin;
        document.CreateTimeArchitectureRequestId = CreateTimeArchitectureRequestId;
        document.CreateTimeStructuralExecutionMode = CreateTimeStructuralExecutionMode;
        document.CreateTimePilotAoaiDeploymentSnapshot = CreateTimePilotAoaiDeploymentSnapshot;
        document.Policy = Policy ?? new PolicySection();
        document.FeasibilityVerdict = FeasibilityVerdict;
        document.EffectiveGovernanceAtCommit = EffectiveGovernanceAtCommit;
        document.ReviewStandardsAtCommit = ReviewStandardsAtCommit;
        document.CommittedArtifactInventory = [.. CommittedArtifactInventory ?? []];
        document.CommittedDecisionReceiptHashSha256 = CommittedDecisionReceiptHashSha256;
    }
}
