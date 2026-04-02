using ArchiForge.Contracts.ProductLearning.Planning;
using ArchiForge.Persistence.ProductLearning.Planning;

namespace ArchiForge.Persistence.Tests.ProductLearning.Planning;

public sealed class ImprovementPlanningServiceTests
{
    private static ImprovementThemeWithEvidence TrendTheme(string name, string facet)
    {
        Guid themeId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        return new ImprovementThemeWithEvidence
        {
            CanonicalKey = "trend:RunOutput|" + facet,
            GroupingExplanation = "Artifact trend grouping (test).",
            Theme = new ImprovementTheme
            {
                ThemeId = themeId,
                Name = name,
                Description = "reject=2 revised=1 followUp=0 trusted=1 total=4",
                EvidenceCount = 4,
                AffectedArtifactTypes = [facet],
                FirstSeenUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                LastSeenUtc = new DateTime(2026, 4, 2, 0, 0, 0, DateTimeKind.Utc),
            },
            ExampleEvidence =
            [
                new ImprovementThemeEvidence
                {
                    EvidenceId = Guid.NewGuid(),
                    ThemeId = themeId,
                    ArchitectureRunId = "run-1",
                    SignalId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                },
            ],
        };
    }

    [Fact]
    public async Task Trend_plan_has_five_steps_and_stable_id()
    {
        ImprovementPlanningService svc = new();

        ImprovementThemeWithEvidence theme = TrendTheme(
            "Improve architecture summary readability",
            "architecture-summary.md");

        ImprovementPlanningOptions options = new()
        {
            RuleVersion = "59R-plan-v1",
            CreatedUtcOverride = new DateTime(2026, 4, 3, 0, 0, 0, DateTimeKind.Utc),
        };

        IReadOnlyList<ImprovementPlan> plans = await svc.BuildPlansAsync(
            [theme],
            options,
            CancellationToken.None);

        ImprovementPlan plan = Assert.Single(plans);

        Assert.Equal(theme.Theme.ThemeId, plan.ThemeId);
        Assert.Equal(5, plan.ProposedChanges.Count);
        Assert.Equal("Content", plan.ProposedChanges[1].ActionType);
        Assert.Contains("architecture-summary.md", plan.Description, StringComparison.Ordinal);
        Assert.True(plan.PriorityScore > 0);

        IReadOnlyList<ImprovementPlan> again = await svc.BuildPlansAsync(
            [theme],
            options,
            CancellationToken.None);

        Assert.Equal(plan.PlanId, again[0].PlanId);
    }

    [Fact]
    public async Task Max_steps_trims_template()
    {
        ImprovementPlanningService svc = new();

        ImprovementThemeWithEvidence theme = TrendTheme("T", "diagram");

        IReadOnlyList<ImprovementPlan> plans = await svc.BuildPlansAsync(
            [theme],
            new ImprovementPlanningOptions { MaxStepsPerPlan = 3, RuleVersion = "v1" },
            CancellationToken.None);

        Assert.Equal(3, plans[0].ProposedChanges.Count);
        Assert.Equal(1, plans[0].ProposedChanges[0].Ordinal);
        Assert.Equal(3, plans[0].ProposedChanges[2].Ordinal);
    }
}
