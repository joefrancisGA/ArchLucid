using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-113 architecture create/review robustness suggestions 1341–1352.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave113ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1341_1343_technology_ledger_read_patch_and_guard_sealed_manifest_mappers()
    {
        string ledger = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "TechnologyLedgerController.cs"));
        string ledgerGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "TechnologyLedgerController.SealedManifestGuard.cs"));

        ledger.Should().Contain("MapTechnologyLedgerSealedManifestConflict");
        ledger.Should().Contain("GetTechnologyLedger");
        ledger.Should().Contain("PatchTechnologyLedgerEntry");
        ledgerGuard.Should().Contain("MapTechnologyLedgerSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1344_1346_clarification_questions_read_apply_and_guard_sealed_manifest_mappers()
    {
        string clarification = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.cs"));
        string clarificationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.SealedManifestGuard.cs"));

        clarification.Should().Contain("MapClarificationQuestionsSealedManifestConflict");
        clarification.Should().Contain("GetClarificationQuestions");
        clarification.Should().Contain("ApplyKnowledgeModelClarificationAnswers");
        clarificationGuard.Should().Contain("MapClarificationQuestionsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1347_1352_technology_ledger_and_clarification_blocked_reason_wiring()
    {
        string ledgerApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "technology-ledger.ts"));
        string ledgerReadBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "technology-ledger-blocked-reason.ts"));
        string ledgerMutationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "technology-ledger-mutation-blocked-reason.ts"));
        string clarificationQuestionsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "review-clarification-questions-api.ts"));
        string clarificationQuestionsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-clarification-questions-blocked-reason.ts"));
        string clarificationAnswersApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "knowledge-model-clarification-api.ts"));
        string clarificationAnswersBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "clarification-answers-mutation-blocked-reason.ts"));
        string technologyBaselinePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "reviews",
                "technology-baseline",
                "TechnologyBaselinePanel.tsx"));
        string clarificationHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-review-clarification-questions.ts"));
        string clarificationPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureCreatedClarificationsPanel.tsx"));

        ledgerApi.Should().Contain("technologyLedgerBlockedReason");
        ledgerApi.Should().Contain("getTechnologyLedger");
        ledgerApi.Should().Contain("technologyLedgerMutationBlockedReason");
        ledgerReadBlocked.Should().Contain("technologyLedgerBlockedReason");
        ledgerMutationBlocked.Should().Contain("technologyLedgerMutationBlockedReason");
        clarificationQuestionsApi.Should().Contain("reviewClarificationQuestionsBlockedReason");
        clarificationQuestionsApi.Should().Contain("getReviewClarificationQuestions");
        clarificationQuestionsBlocked.Should().Contain("reviewClarificationQuestionsBlockedReason");
        clarificationAnswersApi.Should().Contain("clarificationAnswersMutationBlockedReason");
        clarificationAnswersBlocked.Should().Contain("clarificationAnswersMutationBlockedReason");
        technologyBaselinePanel.Should().Contain("technologyLedgerBlockedReason");
        clarificationHook.Should().Contain("reviewClarificationQuestionsBlockedReason");
        clarificationPanel.Should().Contain("clarificationQuestionsBlockedReason");
    }
}
