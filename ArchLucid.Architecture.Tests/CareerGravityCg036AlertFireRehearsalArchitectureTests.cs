using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-036 ratchet: alert fires from rehearsal runs carry honesty in persist path and inbox UI.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg036AlertFireRehearsalArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg036_alert_service_wires_career_honesty_applicator()
    {
        string alertService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "AlertService.cs"));
        string compositeAlertService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Persistence", "Alerts", "CompositeAlertService.cs"));
        string presenter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Core", "Alerts", "AlertCareerHonestyPresenter.cs"));
        string inboxCard = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "alerts", "AlertsInboxAlertCard.tsx"));

        presenter.Should().Contain("RehearsalTitlePrefix");
        presenter.Should().Contain("ShouldApplyRehearsalHonesty");
        alertService.Should().Contain("AlertCareerHonestyApplicator.ApplyAsync");
        compositeAlertService.Should().Contain("AlertCareerHonestyApplicator.ApplyAsync");
        inboxCard.Should().Contain("useAlertInboxCareerHonesty");
        inboxCard.Should().Contain("alert-rehearsal-chip");
    }

    [Fact]
    public void Cg036_docs_record_alert_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-036");
        docs.Should().Contain("Alerts from rehearsal");
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
