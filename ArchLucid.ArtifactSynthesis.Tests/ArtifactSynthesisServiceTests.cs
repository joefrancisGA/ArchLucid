using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisServiceTests
{
    [Fact]
    public async Task SynthesizeAsync_invokes_generators_in_artifact_type_order_and_validates()
    {
        List<string> order = [];
        Mock<IArtifactGenerator> genZ = new();
        genZ.Setup(x => x.ArtifactType).Returns("Zeta");
        genZ
            .Setup(x => x.GenerateAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .Returns(
                (ManifestDocument _, CancellationToken _) =>
                {
                    order.Add("Zeta");

                    return Task.FromResult(NewArtifact("Zeta", "z.txt", "z"));
                });

        Mock<IArtifactGenerator> genA = new();
        genA.Setup(x => x.ArtifactType).Returns("Alpha");
        genA
            .Setup(x => x.GenerateAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .Returns(
                (ManifestDocument _, CancellationToken _) =>
                {
                    order.Add("Alpha");

                    return Task.FromResult(NewArtifact("Alpha", "a.txt", "a"));
                });

        ManifestDocument manifest = NewManifest();
        ArtifactSynthesisService sut = new(
            [genZ.Object, genA.Object],
            new ArtifactBundleValidator(),
            new TechnologyLedgerArtifactLinter(),
            Options.Create(new TechnologyLedgerArtifactLintOptions { Enabled = false }),
            NullLogger<ArtifactSynthesisService>.Instance);

        ArtifactBundle bundle = await sut.SynthesizeAsync(manifest, CancellationToken.None);

        order.Should().Equal("Alpha", "Zeta");
        bundle.Artifacts.Should().HaveCount(2);
        bundle.Trace.GeneratorsUsed.Should().Contain(x => x.Contains("ArtifactGenerator"));
    }

    [Fact]
    public async Task SynthesizeAsync_when_no_generators_adds_trace_note_and_validator_throws()
    {
        ManifestDocument manifest = NewManifest();
        ArtifactSynthesisService sut = new(
            [],
            new ArtifactBundleValidator(),
            new TechnologyLedgerArtifactLinter(),
            Options.Create(new TechnologyLedgerArtifactLintOptions { Enabled = false }),
            NullLogger<ArtifactSynthesisService>.Instance);

        Func<Task> act = async () => await sut.SynthesizeAsync(manifest, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*artifact*");
    }

    [Fact]
    public async Task SynthesizeAsync_warn_only_appends_trace_notes_and_sets_partial_status()
    {
        Mock<IArtifactGenerator> generator = new();
        generator.Setup(x => x.ArtifactType).Returns("Alpha");
        generator
            .Setup(x => x.GenerateAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NewArtifact("Alpha", "a.txt", "content"));

        Mock<ITechnologyLedgerArtifactLinter> linter = new();
        linter
            .Setup(x => x.Lint(
                It.IsAny<ArtifactBundle>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<TechnologyLedgerArtifactLintOptions>()))
            .Returns(
            [
                new TechnologyLedgerArtifactLintFinding
                {
                    RuleId = "UnledgeredHyperscalerToken",
                    ArtifactType = "Alpha",
                    Message = "token missing",
                    MatchedToken = "Azure",
                },
            ]);

        ArtifactSynthesisService sut = new(
            [generator.Object],
            new ArtifactBundleValidator(),
            linter.Object,
            Options.Create(new TechnologyLedgerArtifactLintOptions()),
            NullLogger<ArtifactSynthesisService>.Instance);

        ArtifactBundle bundle = await sut.SynthesizeAsync(NewManifest(), [], CancellationToken.None);

        bundle.Status.Should().Be(ArtifactBundleStatus.Partial);
        bundle.Trace.Notes.Should().Contain(note =>
            note.Contains("TechnologyLedgerArtifactLint[UnledgeredHyperscalerToken]", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SynthesizeAsync_enforcing_mode_throws_when_linter_finds_violations()
    {
        Mock<IArtifactGenerator> generator = new();
        generator.Setup(x => x.ArtifactType).Returns("Alpha");
        generator
            .Setup(x => x.GenerateAsync(It.IsAny<ManifestDocument>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NewArtifact("Alpha", "a.txt", "content"));

        Mock<ITechnologyLedgerArtifactLinter> linter = new();
        linter
            .Setup(x => x.Lint(
                It.IsAny<ArtifactBundle>(),
                It.IsAny<IReadOnlyList<TechnologyLedgerEntry>>(),
                It.IsAny<TechnologyLedgerArtifactLintOptions>()))
            .Returns(
            [
                new TechnologyLedgerArtifactLintFinding
                {
                    RuleId = "ProseHyperscalerFamilyMismatch",
                    ArtifactType = "Alpha",
                    MatchedToken = "S3",
                },
            ]);

        ArtifactSynthesisService sut = new(
            [generator.Object],
            new ArtifactBundleValidator(),
            linter.Object,
            Options.Create(
                new TechnologyLedgerArtifactLintOptions
                {
                    Mode = TechnologyConsistencyFindingEngineMode.Enforcing,
                }),
            NullLogger<ArtifactSynthesisService>.Instance);

        Func<Task> act = async () => await sut.SynthesizeAsync(NewManifest(), [], CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Technology ledger artifact lint failed*");
    }

    private static SynthesizedArtifact NewArtifact(string artifactType, string name, string content)
    {
        return new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = Guid.Empty,
            ManifestId = Guid.Empty,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = artifactType,
            Name = name,
            Format = "text",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content),
        };
    }

    private static ManifestDocument NewManifest()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        return new ManifestDocument
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ManifestMetadata { Name = "N" },
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "d1",
                    Category = "c",
                    Title = "t",
                    SelectedOption = "o",
                    Rationale = "r",
                },
            ],
        };
    }
}
