using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Drafts.QuestionSelection;

/// <summary>
///     Canonical L0 MUST questions from the five Well-Architected pillars and the actor-set model (ADR 0051 / R7).
/// </summary>
public static class UniversalIntakeQuestions
{
    /// <summary>Stable ordering for deterministic selection before L1 pack questions.</summary>
    public static IReadOnlyList<DraftElicitationQuestion> MustQuestions { get; } =
    [
        new()
        {
            QuestionKey = "l0.actor.additional-kinds",
            Prompt =
                "Are there other kinds of users (human or machine) that interact with this system besides those already identified?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        new()
        {
            QuestionKey = "l0.pillar.reliability",
            Prompt =
                "What availability or recovery expectations does this system need (RTO/RPO, uptime target, or best effort)?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        new()
        {
            QuestionKey = "l0.pillar.security",
            Prompt =
                "What data sensitivity, regulatory scope, or trust boundaries apply (for example PII, PHI, PCI, or internal-only)?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        new()
        {
            QuestionKey = "l0.pillar.cost",
            Prompt = "What cost constraints or budgets should the architecture respect?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        new()
        {
            QuestionKey = "l0.pillar.operations",
            Prompt =
                "Who operates this system day-to-day and what observability or incident response is expected?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        new()
        {
            QuestionKey = "l0.pillar.performance",
            Prompt =
                "What performance or scale expectations matter (users, throughput, latency)?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L0Universal,
        },
        // Answers must be exact CloudProvider enum names (None, Azure, Aws, Gcp) — the UI renders a bounded Select.
        new()
        {
            QuestionKey = DraftIntakeQuestionKeys.CloudTarget,
            Prompt =
                "Which cloud provider is this architecture targeting — or is it intentionally cloud-neutral?",
            Tier = ElicitationQuestionTier.Must,
            AnswerKind = ElicitationAnswerKind.Enum,
            Source = ElicitationQuestionSource.L0Universal,
        },
    ];
}
