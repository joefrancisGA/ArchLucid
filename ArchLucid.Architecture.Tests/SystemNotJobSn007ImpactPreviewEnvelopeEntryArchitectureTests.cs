using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-007 ratchet: Working nested Impact preview is the policy cheap envelope; architecture sketch → SN-008.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn007ImpactPreviewEnvelopeEntryArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn007_envelope_entry_module_forbids_career_architecture_what_if()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-impact-preview-envelope-entry.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_BODY");
        module.Should().Contain("not a Career architecture what-if");
        module.Should().Contain("not production observation");
        module.Should().Contain("SN-008");
    }

    [Fact]
    public void Sn007_nested_impact_preview_route_and_client_exist()
    {
        string routes = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-routes.ts"));
        string nestedClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architectures",
                "[architectureId]",
                "impact-preview",
                "ArchitectureNestedImpactPreviewPageClient.tsx"));

        routes.Should().Contain("architectureNestedImpactPreviewPath");
        routes.Should().Contain("impact-preview");
        nestedClient.Should().Contain("nestedPolicyEnvelopeEntry");

        string pageView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "impact-preview",
                "_sections",
                "EvolutionReviewPageView.tsx"));

        pageView.Should().Contain("ImpactPreviewPolicyEnvelopeEntryStrip");
    }

    [Fact]
    public void Sn007_vitest_ratchet_names_policy_envelope_entry()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-impact-preview-envelope-entry.test.ts"));

        test.Should().Contain("SN-007");
        test.Should().Contain("architectureNestedImpactPreviewPath");
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

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
