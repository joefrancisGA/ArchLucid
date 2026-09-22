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
        string export = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.Export.cs"));
        string controller = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Findings",
                "FindingVerificationController.cs"));
        string guard = File.ReadAllText(
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
        string learningReport = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "LearningController.PlanningReport.cs"));
        string learningGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "LearningController.SealedManifestGuard.cs"));
        string productLearning = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Advisory",
                "ProductLearningController.Triage.cs"));
        string productLearningGuard = File.ReadAllText(
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
        string verificationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "finding-verification-api.ts"));
        string verificationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-verification-mutation-blocked-reason.ts"));
        string mergeConflictApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "finding-merge-conflict-api.ts"));
        string mergeConflictBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-merge-conflict-blocked-reason.ts"));
        string conversationApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "conversation-api.ts"));
        string askBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "ask", "ask-blocked-reason.ts"));
        string requestDraftApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-request-draft-api.ts"));
        string requestDraftBlocked = File.ReadAllText(
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
