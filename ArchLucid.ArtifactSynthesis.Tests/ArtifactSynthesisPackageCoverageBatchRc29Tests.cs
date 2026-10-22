using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>RC29 package-coverage batch: markdown section validator edges and in-memory bundle repository paths.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc29Tests
{
    [Fact]
    public void ArchitectureMarkdownSectionValidator_ignores_third_level_headings()
    {
        string markdown = """
                          ### Objective
                          ## Assumptions
                          """;

        IReadOnlyList<string> missing = ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown);

        missing.Should().Contain("Objective");
        missing.Should().NotContain("Assumptions");
    }

    [Fact]
    public void ArchitectureMarkdownSectionValidator_blank_markdown_reports_all_required_sections()
    {
        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders("   ")
            .Should().BeEquivalentTo(ArchitectureMarkdownSectionValidator.RequiredSectionTitles);
    }

    [Fact]
    public async Task InMemoryArtifactBundleRepository_strips_bodies_when_loadArtifactBodies_false()
    {
        InMemoryArtifactBundleRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        ArtifactBundle bundle = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            BundleId = Guid.NewGuid(),
            ManifestId = manifestId,
            Artifacts =
            [
                new SynthesizedArtifact
                {
                    ArtifactType = ArtifactType.Inventory,
                    Content = "inventory-body",
                    ContentHash = "hash-1"
                }
            ]
        };

        await repository.SaveAsync(bundle, CancellationToken.None);

        ArtifactBundle? loaded = await repository.GetByManifestIdAsync(
            scope,
            manifestId,
            loadArtifactBodies: false,
            CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.Artifacts[0].Content.Should().BeEmpty();
        loaded.Artifacts[0].ContentHash.Should().Be("hash-1");
    }

    [Fact]
    public async Task InMemoryArtifactBundleRepository_GetArtifactById_returns_matching_artifact()
    {
        InMemoryArtifactBundleRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };
        Guid manifestId = Guid.NewGuid();
        Guid artifactId = Guid.NewGuid();

        await repository.SaveAsync(
            new ArtifactBundle
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                BundleId = Guid.NewGuid(),
                ManifestId = manifestId,
                Artifacts =
                [
                    new SynthesizedArtifact
                    {
                        ArtifactId = artifactId,
                        ArtifactType = ArtifactType.CoverageSummary,
                        Content = "coverage",
                        ContentHash = "hash-2"
                    }
                ]
            },
            CancellationToken.None);

        SynthesizedArtifact? artifact = await repository.GetArtifactByIdAsync(
            scope,
            manifestId,
            artifactId,
            CancellationToken.None);

        artifact.Should().NotBeNull();
        artifact!.Content.Should().Be("coverage");
    }
}
