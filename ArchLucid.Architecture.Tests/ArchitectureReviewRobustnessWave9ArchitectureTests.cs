using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-9 architecture create/review robustness suggestions (81–90).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave9ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion81_list_complete_requires_committed_golden_manifest()
    {
        string listResolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Runs", "AuthorityRunLifecyclePhaseListResolver.cs"));

        listResolver.Should().Contain("IsCommittedWithGoldenManifest");
        listResolver.Should().Contain("ArchitectureRunStatus.Committed");
    }

    [Fact]
    public void Suggestion82_evidence_package_pin_resolver_retired()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "Orchestration",
                    "Pipeline",
                    "EvidencePackagePinResolver.cs"))
            .Should()
            .BeFalse();

        string registrar = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Host.Composition",
                "Startup",
                "Modules",
                "RunLifecycleOrchestrationCompositionRegistrar.ExportsGovernance.cs"));

        registrar.Should().NotContain("EvidencePackagePinResolver");
        registrar.Should().Contain("RunEvidencePackagePinService");
    }

    [Fact]
    public void Suggestion83_sponsor_exports_use_lifecycle_guard()
    {
        string sponsorPacket = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "SponsorReviewPacketBuilder.cs"));

        sponsorPacket.Should().Contain("AuthorityLifecycleCompareExportGuard");

        string buyerProof = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "BuyerProofPackBuilder.cs"));

        buyerProof.Should().Contain("AuthorityLifecycleCompareExportGuard");
    }

    [Fact]
    public void Suggestion84_multi_cloud_collection_utc_pinned_at_create()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"));

        pinService.Should().Contain("TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Aws");
        pinService.Should().Contain("TryGetLatestCollectionTimestampUtcInScopeAsync(scope, CloudProvider.Gcp");
    }

    [Fact]
    public void Suggestion85_roi_freshness_prefers_pinned_evidence_json()
    {
        string resolver = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Roi", "RoiCostEvidenceCollectionResolver.cs"));

        resolver.Should().Contain("ResolvePinsFromHeader");
        resolver.Should().Contain("CollectionUtc");
    }

    [Fact]
    public void Suggestion86_hasher_b_binds_create_time_pins()
    {
        File.Exists(
                Path.Combine(
                    RepoRoot,
                    "ArchLucid.Application",
                    "Runs",
                    "RunHeaderCreateTimePinCommitmentFactory.cs"))
            .Should()
            .BeTrue();

        string fingerprint = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Manifest", "GoldenManifestFingerprint.cs"));

        fingerprint.Should().Contain("GoldenManifestCreateTimePinCommitment");
        fingerprint.Should().Contain("createTimePolicyPackPins");

        string cli = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Cli", "ArchLucidCliApiClient.Runs.FingerprintSeed.cs"));

        cli.Should().Contain("RunHeaderCreateTimePinCommitmentFactory.TryFromPinJson");
    }

    [Fact]
    public void Suggestion87_create_time_kappa_header_pin()
    {
        string migration = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Migrations",
                "344_RunArchitectureVersionContentHashPin.sql"));

        migration.Should().Contain("PinnedArchitectureVersionContentHashSha256");

        string findings = ArchitectureSourceProbe.ReadFindingAnalysisContextBuilder();

        findings.Should().Contain("PinnedArchitectureVersionContentHashSha256");
        findings.Should().Contain("ArchitectureVersionContentFingerprintVerifier");
    }

    [Fact]
    public void Suggestion88_policy_pack_json_byte_integrity()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunPolicyPackPinService.cs"));

        pinService.Should().Contain("SHA256.HashData(Encoding.UTF8.GetBytes(header.PinnedPolicyPackIdsJson))");
    }

    [Fact]
    public void Suggestion89_empty_pin_json_normalized()
    {
        string pinService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunEvidencePackagePinService.cs"));

        pinService.Should().NotContain("if (ordered.Length == 0)");

        string deserializer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunHeaderPinDeserializer.cs"));

        deserializer.Should().Contain("if (parsed is not null)");
    }

    [Fact]
    public void Suggestion90_focused_pilot_restore_on_replay_and_async_resume()
    {
        string replay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Replay", "ReplayRunExecutePreparedStage.cs"));

        replay.Should().Contain("BeginRestoredScope");

        string asyncResume = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Runs",
                "Orchestration",
                "IncompleteAuthorityPipelineExecuteHandler.cs"));

        asyncResume.Should().Contain("BeginRestoredScope");
    }
}
