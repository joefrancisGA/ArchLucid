using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-070 ratchet: architect restatement cannot upgrade semantic support band to Supported.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs070RestatementDoesNotResetBandArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As070_policy_and_claim_resolver_exist_in_decisioning_findings()
    {
        string policy = ReadRepoFile(
            "ArchLucid.Decisioning",
            "Findings",
            "FindingArchitectRestatementSemanticSupportBandPolicy.cs");

        string resolver = ReadRepoFile(
            "ArchLucid.Decisioning",
            "Findings",
            "FindingSemanticSupportBandClaimMessageResolver.cs");

        policy.Should().Contain("ResolveEffectiveClaimBand");
        policy.Should().Contain("ResolveRestatementHumanBand");
        policy.Should().Contain("CapRestatementHumanBand");
        policy.Should().Contain("never Supported");

        resolver.Should().Contain("Architect restatement");
        resolver.Should().Contain("excluded");
    }

    [Fact]
    public void As070_emission_and_overlay_scoring_use_claim_message_resolver()
    {
        string emission = ReadRepoFile(
            "ArchLucid.Decisioning",
            "Findings",
            "FindingSemanticSupportBandEmissionApplicator.cs");

        string overlay = ReadRepoFile(
            "ArchLucid.Decisioning",
            "Findings",
            "FindingSemanticSupportBandOverlayScoring.cs");

        emission.Should().Contain("FindingSemanticSupportBandClaimMessageResolver.Resolve");
        emission.Should().NotContain("ArchitectRestatement");

        overlay.Should().Contain("FindingSemanticSupportBandClaimMessageResolver.Resolve");
        overlay.Should().NotContain("ArchitectRestatement");
    }

    [Fact]
    public void As070_ui_honesty_module_documents_claim_vs_restatement_bands()
    {
        string honesty = ReadRepoFile(
            "archlucid-ui",
            "src",
            "lib",
            "findings",
            "finding-architect-restatement-semantic-support-band-honesty.ts");

        honesty.Should().Contain("human judgment");
        honesty.Should().Contain("NotScored");
        honesty.Should().Contain("Supported");
    }

    private static string ReadRepoFile(params string[] segments)
    {
        return File.ReadAllText(Path.Combine(RepoRoot, Path.Combine(segments)));
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
