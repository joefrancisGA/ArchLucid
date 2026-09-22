using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-023 ratchet: package print shows rehearsal honesty when execute stamp is not career-complete.
/// Print remains enabled; CG-041 owns repeating CSS watermark.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg023CareerBlocksPrintArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg023_package_print_client_resolves_door_stamp_for_rehearsal_strip()
    {
        string client = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintPageClient.tsx"));
        string helper = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "package-print-rehearsal-honesty.ts"));

        client.Should().Contain("resolvePackagePrintRehearsalHonestyStrip");
        client.Should().Contain("resolveCareerArtifactExportHonestyDoorFields");
        client.Should().Contain("useEffectiveWorkingCareerRehearsalDoor");
        helper.Should().Contain("PACKAGE_PRINT_REHEARSAL_STRIP_TITLE");
        helper.Should().Contain("shouldShowPackagePrintRehearsalHonestyStrip");
    }

    [Fact]
    public void Cg023_print_view_renders_print_only_rehearsal_strip()
    {
        string view = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintPageView.tsx"));
        string strip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "print",
                "_sections",
                "PackagePrintRehearsalHonestyStrip.tsx"));

        view.Should().Contain("PackagePrintRehearsalHonestyStripView");
        view.Should().Contain("rehearsalHonestyStrip");
        strip.Should().Contain("package-print-rehearsal-honesty-strip");
        strip.Should().Contain("hidden");
        strip.Should().Contain("print:block");
    }

    [Fact]
    public void Cg023_globals_css_styles_print_rehearsal_strip()
    {
        string globals = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "app", "globals.css"));

        globals.Should().Contain("package-print-rehearsal-honesty-strip");
        globals.Should().Contain("@media print");
    }

    [Fact]
    public void Cg023_docs_record_package_print_rehearsal_gate()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-023");
        docs.Should().Contain("print");
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
