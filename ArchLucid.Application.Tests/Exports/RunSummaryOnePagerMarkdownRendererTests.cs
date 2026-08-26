using ArchLucid.Application.Exports;
using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunSummaryOnePagerMarkdownRendererTests
{
    [Fact]
    public void Render_includes_severity_table_executive_summary_and_top_findings()
    {
        RunSummaryOnePagerDocumentModel model = new()
        {
            RunId = "run-abc",
            SystemName = "Payments",
            CriticalCount = 1,
            HighCount = 2,
            MediumCount = 3,
            LowCount = 4,
            SponsorReport = "Risk is elevated; remediate encryption first.",
            TopFindingTitles = ["Missing CMK", "Open ingress", "Stale DR plan"]
        };

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);

        markdown.Should().Contain("Payments");
        markdown.Should().Contain("run-abc");
        markdown.Should().Contain("| Critical | 1 |");
        markdown.Should().Contain("Risk is elevated; remediate encryption first.");
        markdown.Should().Contain("- Missing CMK");
        markdown.Should().Contain("- Open ingress");
        markdown.Should().Contain("- Stale DR plan");
        markdown.Should().Contain("generated with AI assistance");
        markdown.Should().Contain("Deterministic findings (sealed)");
        markdown.Should().Contain("Agent findings (advisory)");
    }

    [Fact]
    public void Render_includes_simulator_rehearsal_notice_when_simulator_mode()
    {
        RunSummaryOnePagerDocumentModel model = new()
        {
            RunId = "run-abc",
            SystemName = "Payments",
            CriticalCount = 0,
            HighCount = 0,
            MediumCount = 0,
            LowCount = 0,
            SponsorReport = "Summary.",
            TopFindingTitles = [],
            IsSimulatorMode = true,
            SimulatorRehearsalTitle = SimulatorModeExportRehearsalMarkdown.NoticeTitle,
            SimulatorRehearsalBody = SimulatorModeExportRehearsalMarkdown.NoticeBody,
        };

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);

        markdown.Should().Contain("Simulator mode");
        markdown.Should().Contain("not live AI output");
        markdown.Should().Contain("rule-based analysis in simulator mode");
    }

    [Fact]
    public void Render_lists_sealed_snapshot_id_when_present()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        RunSummaryOnePagerDocumentModel model = new()
        {
            RunId = "run-abc",
            SystemName = "Payments",
            CriticalCount = 0,
            HighCount = 0,
            MediumCount = 0,
            LowCount = 0,
            SponsorReport = "Summary.",
            TopFindingTitles = [],
            HasSealedSnapshot = true,
            FindingsSnapshotId = snapshotId.ToString("D"),
            SealedFindingCount = 12,
        };

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);

        markdown.Should().Contain(snapshotId.ToString("D"));
        markdown.Should().Contain("12 finding(s)");
    }

    [Fact]
    public void Render_includes_demo_and_active_trial_notices()
    {
        RunSummaryOnePagerDocumentModel model = new()
        {
            RunId = "run-abc",
            SystemName = "Payments",
            CriticalCount = 1,
            HighCount = 0,
            MediumCount = 0,
            LowCount = 0,
            SponsorReport = "Summary.",
            TopFindingTitles = ["Gap"],
            IsDemoTenant = true,
            ActiveTrialExportNotice = ActiveTrialExportNoticeFormatter.BaseSuffix
        };

        string markdown = RunSummaryOnePagerMarkdownRenderer.Render(model);

        markdown.Should().Contain("Demo notice");
        markdown.Should().Contain(ArchitectureReviewBoardCoverPageContent.DemoTenantNotice);
        markdown.Should().Contain("Trial notice");
        markdown.Should().Contain(ActiveTrialExportNoticeFormatter.BaseSuffix);
    }
}
