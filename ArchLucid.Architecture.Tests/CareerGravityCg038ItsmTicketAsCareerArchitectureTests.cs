using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-038 ratchet: ITSM outbound stamps rehearsal honesty on ticket fields and dialog UI.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg038ItsmTicketAsCareerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg038_itsm_outbound_wires_career_honesty_presenter()
    {
        string presenter = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "Outbound",
                "ItsmOutboundCareerHonestyPresenter.cs"));
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Integrations",
                "Itsm",
                "Outbound",
                "ItsmOutboundIssueCreationService.cs"));
        string dialog = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "itsm", "ItsmOutboundCreateIssueDialog.tsx"));

        presenter.Should().Contain("RehearsalSummaryPrefix");
        service.Should().Contain("ItsmOutboundCareerHonestyPresenter.Apply");
        dialog.Should().Contain("ItsmOutboundCareerHonestyStrip");
    }

    [Fact]
    public void Cg038_docs_record_itsm_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-038");
        docs.Should().Contain("ITSM tickets cannot present rehearsal as Career");
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
