using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-037 ratchet: digest emails and sponsor hub label rehearsal runs.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg037DigestAsCareerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg037_exec_digest_wires_career_honesty_presenter()
    {
        string presenter = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestCareerHonestyPresenter.cs"));
        string composer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "ExecDigest", "ExecDigestComposer.cs"));
        string dispatcher = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Notifications",
                "Email",
                "ExecDigestEmailDispatcher.cs"));
        string sponsorPanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(marketing)",
                "digest",
                "sponsor",
                "_sections",
                "ExecDigestSponsorDeepLinkPanel.tsx"));

        presenter.Should().Contain("RehearsalSubjectPrefix");
        composer.Should().Contain("ExecDigestCareerHonestyPresenter.ResolveSummary");
        dispatcher.Should().Contain("composition.RehearsalSubjectPrefix");
        sponsorPanel.Should().Contain("digest-sponsor-rehearsal-row-label");
        sponsorPanel.Should().Contain("rehearsalBodyDisclaimer");
    }

    [Fact]
    public void Cg037_docs_record_digest_rehearsal_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-037");
        docs.Should().Contain("Digests cannot present rehearsal as Career");
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
