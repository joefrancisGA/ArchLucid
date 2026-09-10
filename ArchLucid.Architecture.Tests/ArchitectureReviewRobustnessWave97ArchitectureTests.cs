using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-97 architecture create/review robustness suggestions 1149–1160.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave97ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1149_1155_artifact_export_replay_and_batch_create_action_level_sealed_manifest_conflict_mappers()
    {
        string artifactExportDownload = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.Export.Download.cs"));
        string artifactExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ArtifactExportController.SealedManifestGuard.cs"));
        string exportsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ExportsController.cs"));
        string batchCreate = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Create.Batch.cs"));

        artifactExportDownload.Should().Contain("MapArtifactExportSealedManifestConflict");
        artifactExportGuard.Should().Contain("MapArtifactExportSealedManifestConflict");
        exportsController.Should().Contain("MapExportReplaySealedManifestConflict");
        batchCreate.Should().Contain("MapRunsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1156_1158_policy_assignment_export_lineage_and_identity_blocked_reason_wiring()
    {
        string assignBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-assign-mutation-blocked-reason.ts"));
        string assignApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));
        string exportLineageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "exports",
                "export-lineage-verify-blocked-reason.ts"));
        string exportLineageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-lineage-verify-api.ts"));
        string identityBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-identity-mutation-blocked-reason.ts"));
        string identityApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-identity-api.ts"));

        assignBlocked.Should().Contain("policyPackAssignMutationBlockedReason");
        assignApi.Should().Contain("policyPackAssignMutationBlockedReason");
        exportLineageBlocked.Should().Contain("exportLineageVerifyBlockedReason");
        exportLineageApi.Should().Contain("exportLineageVerifyBlockedReason");
        identityBlocked.Should().Contain("architectureIdentityMutationBlockedReason");
        identityApi.Should().Contain("architectureIdentityMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1159_1160_review_archive_and_pre_finalize_simulation_blocked_reason_wiring()
    {
        string archiveBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-archive-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string preFinalizeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "pre-finalize-synthetic-simulation-blocked-reason.ts"));
        string preFinalizeApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "pre-finalize-synthetic-simulation-api.ts"));

        archiveBlocked.Should().Contain("reviewArchiveMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewArchiveMutationBlockedReason");
        preFinalizeBlocked.Should().Contain("preFinalizeSyntheticSimulationBlockedReason");
        preFinalizeApi.Should().Contain("preFinalizeSyntheticSimulationBlockedReason");
    }
}
