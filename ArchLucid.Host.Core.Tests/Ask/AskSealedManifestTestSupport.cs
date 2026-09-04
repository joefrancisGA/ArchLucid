using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Moq;

namespace ArchLucid.Host.Core.Tests.Ask;

/// <summary>Wave-24 ask guard test doubles: sealed hash, inventory-bound manifests, and compare pin headers.</summary>
internal static class AskSealedManifestTestSupport
{
    internal const string SealedManifestHash = "sealed-manifest-hash-for-ask-tests";

    private static readonly byte[] DefaultPinFingerprint = [0x01, 0x02, 0x03];

    internal static void ApplySealedManifestDefaults(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        if (string.IsNullOrWhiteSpace(manifest.ManifestHash))
        {
            manifest.ManifestHash = SealedManifestHash;
        }

        if (manifest.CommittedArtifactInventory.Count == 0)
        {
            manifest.CommittedArtifactInventory.Add(CreateArtifactBundleInventoryEntry());
        }
    }

    internal static IManifestHashService CreateManifestHashService()
    {
        Mock<IManifestHashService> manifestHash = new();
        manifestHash
            .Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>()))
            .Returns<ManifestDocument>(manifest => manifest.ManifestHash ?? SealedManifestHash);

        return manifestHash.Object;
    }

    internal static IRunRepository CreateRunRepository()
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) => CreatePinnedRunHeader(runId));

        return runs.Object;
    }

    internal static RunRecord CreatePinnedRunHeader(Guid runId) =>
        new()
        {
            RunId = runId,
            PinnedPolicyPackIdsHashSha256 = DefaultPinFingerprint,
            PinnedEvidencePackagePinsHashSha256 = DefaultPinFingerprint,
            PinnedArchitectureVersionContentHashSha256 = DefaultPinFingerprint,
            PinnedKnowledgeModelContentHashSha256 = DefaultPinFingerprint,
        };

    private static CommittedArtifactInventoryEntry CreateArtifactBundleInventoryEntry() =>
        new()
        {
            ArtifactName = "artifact-bundle",
            ContentHashSha256 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
            ContentType = "application/octet-stream",
            Producer = "test",
            CapturedUtc = DateTime.UtcNow,
        };
}
