using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TechnologyLedgerArtifactLinterTests
{
    private readonly TechnologyLedgerArtifactLinter _sut = new();

    [Fact]
    public void Lint_when_ledger_empty_returns_no_findings()
    {
        ArtifactBundle bundle = BundleWithContent(
            ArtifactType.ArchitectureNarrative,
            "Uses Azure App Service for compute.");

        IReadOnlyList<TechnologyLedgerArtifactLintFinding> findings = _sut.Lint(
            bundle,
            [],
            new TechnologyLedgerArtifactLintOptions());

        findings.Should().BeEmpty();
    }

    [Fact]
    public void Lint_detects_prose_hyperscaler_family_mismatch()
    {
        ArtifactBundle bundle = BundleWithContent(
            ArtifactType.ReferenceArchitectureMarkdown,
            "Primary compute runs on Azure App Service.");

        List<TechnologyLedgerEntry> ledger =
        [
            ChosenCloud(CloudProvider.Aws),
            Chosen(TechnologyLedgerRole.ComputeRuntime, "AWS Lambda", CloudProvider.Aws),
        ];

        IReadOnlyList<TechnologyLedgerArtifactLintFinding> findings = _sut.Lint(
            bundle,
            ledger,
            new TechnologyLedgerArtifactLintOptions());

        findings.Should().Contain(finding => finding.RuleId == "ProseHyperscalerFamilyMismatch");
        findings.Should().Contain(finding => finding.MatchedToken == "Azure");
    }

    [Fact]
    public void Lint_detects_unledgered_hyperscaler_token()
    {
        ArtifactBundle bundle = BundleWithContent(
            ArtifactType.Inventory,
            """{"items":[{"name":"Azure Key Vault"}]}""");

        List<TechnologyLedgerEntry> ledger =
        [
            ChosenCloud(CloudProvider.Azure),
            Chosen(TechnologyLedgerRole.IdentityProvider, "Entra ID", CloudProvider.Azure),
        ];

        IReadOnlyList<TechnologyLedgerArtifactLintFinding> findings = _sut.Lint(
            bundle,
            ledger,
            new TechnologyLedgerArtifactLintOptions());

        findings.Should().Contain(finding => finding.RuleId == "UnledgeredHyperscalerToken");
    }

    private static ArtifactBundle BundleWithContent(string artifactType, string content)
    {
        return new ArtifactBundle
        {
            BundleId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Artifacts = [Artifact(artifactType, content)],
        };
    }

    private static SynthesizedArtifact Artifact(string artifactType, string content)
    {
        return new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            ArtifactType = artifactType,
            Name = $"{artifactType}.txt",
            Content = content,
            ContentHash = "hash",
        };
    }

    private static TechnologyLedgerEntry ChosenCloud(CloudProvider providerFamily)
    {
        return Chosen(TechnologyLedgerRole.CloudPlatform, providerFamily.ToString(), providerFamily);
    }

    private static TechnologyLedgerEntry Chosen(
        TechnologyLedgerRole role,
        string technologyName,
        CloudProvider providerFamily)
    {
        return new TechnologyLedgerEntry
        {
            EntryId = Guid.NewGuid().ToString("N"),
            Role = role,
            TechnologyName = technologyName,
            ProviderFamily = providerFamily,
            Status = TechnologyLedgerStatus.Chosen,
            Source = TechnologyLedgerSource.User,
        };
    }
}
