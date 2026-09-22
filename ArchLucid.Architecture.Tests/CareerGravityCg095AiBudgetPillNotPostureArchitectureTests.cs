using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-095 ratchet: LLM budget pill is cost control, not Career/Rehearsal execute posture.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg095AiBudgetPillNotPostureArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg095_budget_pill_wires_career_honesty_and_at_cap_copy()
    {
        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "llm",
                "llm-budget-status-pill-career-honesty.ts"));
        string pill = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "llm", "LlmBudgetStatusPill.tsx"));
        string topBar = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "shell", "OperatorShellTopBar.tsx"));

        copy.Should().Contain("LLM_BUDGET_STATUS_PILL_CAREER_HONESTY_BODY");
        copy.Should().Contain("not the Career or Rehearsal door");
        copy.Should().Contain("at cap");
        copy.Should().NotContain("— paused");
        pill.Should().Contain("llm-budget-status-pill-career-honesty");
        pill.Should().Contain("resolveLlmBudgetStatusPillPresentation");
        topBar.Should().Contain("isOperatorExperienceFullShellEnv");
        topBar.Should().Contain("LlmBudgetStatusPillDeferred");
    }

    [Fact]
    public void Cg095_docs_record_budget_not_execute_posture()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-095");
        docs.Should().Contain("AI budget pill is not execute posture");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not locate repository root.");
    }
}
