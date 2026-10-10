using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-105 architecture create/review robustness suggestions 1245–1256.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave105ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1245_1247_finding_verification_export_and_async_sealed_manifest_mappers()
    {
        string export = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.Export.cs"));
        string controller = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.SealedManifestGuard.cs"));

        export.Should().Contain("MapFindingVerificationSealedManifestConflict");
        export.Should().Contain("EnsureFindingVerificationRunSealedManifestAllowedAsync");
        controller.Should().Contain("EnsureFindingVerificationRunSealedManifestAllowedAsync");
        guard.Should().Contain("MapFindingVerificationSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1248_1251_learning_and_product_learning_report_sealed_manifest_mappers()
    {
        string learningReport = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "LearningController.PlanningReport.cs"));
        string learningGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "LearningController.SealedManifestGuard.cs"));
        string productLearning = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "ProductLearningController.Triage.cs"));
        string productLearningGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "ProductLearningController.SealedManifestGuard.cs"));

        learningReport.Should().Contain("MapLearningPlanningSealedManifestConflict");
        learningGuard.Should().Contain("MapLearningPlanningSealedManifestConflict");
        productLearning.Should().Contain("MapProductLearningSealedManifestConflict");
        productLearningGuard.Should().Contain("MapProductLearningSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1252_1256_verification_merge_ask_and_request_draft_blocked_reason_wiring()
    {
        string verificationApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-verification-api.ts"));
        string verificationBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-verification-mutation-blocked-reason.ts"));
        string mergeConflictApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "finding-merge-conflict-api.ts"));
        string mergeConflictBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-merge-conflict-blocked-reason.ts"));
        string conversationApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "conversation-api.ts"));
        string askBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "ask", "ask-blocked-reason.ts"));
        string requestDraftApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-request-draft-api.ts"));
        string requestDraftBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-request-draft-mutation-blocked-reason.ts"));

        verificationApi.Should().Contain("findingVerificationMutationBlockedReason");
        verificationBlocked.Should().Contain("findingVerificationMutationBlockedReason");
        mergeConflictApi.Should().Contain("findingMergeConflictBlockedReason");
        mergeConflictBlocked.Should().Contain("findingMergeConflictBlockedReason");
        conversationApi.Should().Contain("askBlockedReason");
        conversationApi.Should().Contain("fetchComparisonNarrativeViaAsk");
        askBlocked.Should().Contain("askBlockedReason");
        requestDraftApi.Should().Contain("architectureRequestDraftMutationBlockedReason");
        requestDraftBlocked.Should().Contain("architectureRequestDraftMutationBlockedReason");
    }
}
