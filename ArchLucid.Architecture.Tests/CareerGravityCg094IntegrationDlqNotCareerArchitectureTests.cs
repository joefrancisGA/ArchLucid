using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// CG-094 ratchet: integration DLQ route shows ops-only career honesty.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CareerGravityCg094IntegrationDlqNotCareerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Cg094_dlq_page_wires_career_honesty_strip()
    {
        string copy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "internal",
                "integration-events-dlq-career-honesty.ts"));
        string pageClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "internal",
                "failed-integration-messages",
                "_sections",
                "IntegrationEventsDlqPageClient.tsx"));

        copy.Should().Contain("INTEGRATION_EVENTS_DLQ_CAREER_HONESTY_TITLE");
        copy.Should().Contain("not sealed Career proof");
        pageClient.Should().Contain("IntegrationEventsDlqCareerHonestyStrip");
        pageClient.Should().NotContain("careerComplete");
    }

    [Fact]
    public void Cg094_docs_record_dlq_ops_honesty()
    {
        string docs = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        docs.Should().Contain("CG-094");
        docs.Should().Contain("Integration DLQ is not Career proof");
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
