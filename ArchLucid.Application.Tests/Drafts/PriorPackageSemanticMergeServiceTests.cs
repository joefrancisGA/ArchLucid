using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Drafts;

[Trait("Category", "Unit")]
public sealed class PriorPackageSemanticMergeServiceTests
{
    [Fact]
    public async Task MergePriorPackageSemanticsAsync_inherits_actors_assumptions_and_decisions()
    {
        PriorPackageSemanticContextFixture fixture = CreateFixture();

        PriorPackageSemanticMergeService sut = CreateSut(fixture);

        DraftRequestDocument document = new();

        await sut.MergePriorPackageSemanticsAsync(
            fixture.Scope,
            document,
            fixture.PriorRunId.ToString("D"),
            CancellationToken.None);

        document.ActorSet.Actors.Should().ContainSingle();
        document.StructuredBrief.ConfirmedAssumptions.Should().Contain("Single-region MVP");
        document.StructuredBrief.ConfirmedAssumptions.Should().Contain("Audit logs retained 7 years");
        document.StructuredBrief.ConfirmedInlineRequirements.Should().Contain("Reliability: RTO 4 hours");
        document.StructuredBrief.ConfirmedConstraints.Should().Contain("EU data residency");
        document.TransparencyTrail.Asserted.Should().Contain(entry => entry.Key.StartsWith("prior.decision.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task MergePriorPackageSemanticsAsync_skips_unknown_sentinels()
    {
        PriorPackageSemanticContextFixture fixture = CreateFixture(includeUnknownSentinels: true);

        PriorPackageSemanticMergeService sut = CreateSut(fixture);

        DraftRequestDocument document = new();

        await sut.MergePriorPackageSemanticsAsync(
            fixture.Scope,
            document,
            fixture.PriorRunId.ToString("D"),
            CancellationToken.None);

        document.StructuredBrief.ConfirmedAssumptions.Should().NotContain(
            ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview);
        document.StructuredBrief.ConfirmedConstraints.Should().NotContain(
            ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview);
        document.StructuredBrief.ConfirmedInlineRequirements.Should().NotContain(
            ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview);
    }

    [Fact]
    public async Task MergePriorPackageSemanticsOntoRequestAsync_inherits_semantics_for_quick_start()
    {
        PriorPackageSemanticContextFixture fixture = CreateFixture();

        PriorPackageSemanticMergeService sut = CreateSut(fixture);

        ArchitectureRequest request = new()
        {
            Description = "Second review from prior package",
            SystemName = "second-review",
        };

        await sut.MergePriorPackageSemanticsOntoRequestAsync(
            fixture.Scope,
            request,
            fixture.PriorRunId.ToString("D"),
            CancellationToken.None);

        request.DraftActors.Should().ContainSingle();
        request.Assumptions.Should().Contain("Single-region MVP");
        request.InlineRequirements.Should().Contain("Reliability: RTO 4 hours");
        request.Constraints.Should().Contain("EU data residency");
        request.IntakeTransparencyTrail!.Asserted.Should().Contain(entry => entry.Key.StartsWith("prior.decision.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Merge_then_project_retains_actor_and_decision_trail()
    {
        PriorPackageSemanticContextFixture fixture = CreateFixture();

        PriorPackageSemanticMergeService sut = CreateSut(fixture);
        DraftRequestProjector projector = new();
        DraftRequestDocument document = new()
        {
            FreeTextIntent = "Continue the regulated workload review with inherited semantics.",
            PriorRunId = fixture.PriorRunId.ToString("D"),
        };

        await sut.MergePriorPackageSemanticsAsync(
            fixture.Scope,
            document,
            fixture.PriorRunId.ToString("D"),
            CancellationToken.None);

        ArchitectureRequest projected = projector.Project(document, Guid.NewGuid());

        projected.DraftActors.Should().ContainSingle();
        projected.Assumptions.Should().Contain("Single-region MVP");
        projected.InlineRequirements.Should().Contain("Reliability: RTO 4 hours");
        projected.IntakeTransparencyTrail!.Asserted.Should().Contain(entry => entry.Key.StartsWith("prior.decision.", StringComparison.Ordinal));
    }

    [Fact]
    public async Task GetPriorPackageSemanticCountsAsync_returns_non_zero_counts()
    {
        PriorPackageSemanticContextFixture fixture = CreateFixture();

        PriorPackageSemanticMergeService sut = CreateSut(fixture);

        PriorPackageSemanticCountsDto? counts = await sut.GetPriorPackageSemanticCountsAsync(
            fixture.Scope,
            fixture.PriorRunId.ToString("D"),
            CancellationToken.None);

        counts.Should().NotBeNull();
        counts!.ActorCount.Should().Be(1);
        counts.AssumptionCount.Should().Be(2);
        counts.DecisionCount.Should().Be(1);
        counts.RequirementCount.Should().BeGreaterThan(0);
    }

    private static PriorPackageSemanticMergeService CreateSut(PriorPackageSemanticContextFixture fixture)
    {
        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByIdAsync(fixture.Scope, fixture.PriorRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fixture.PriorRun);

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync("prior-req", It.IsAny<CancellationToken>()))
            .ReturnsAsync(fixture.PriorRequest);

        Mock<IGoldenManifestRepository> manifestRepository = new();
        manifestRepository
            .Setup(r => r.GetByIdAsync(fixture.Scope, fixture.ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fixture.Manifest);

        return new PriorPackageSemanticMergeService(
            runRepository.Object,
            requestRepository.Object,
            manifestRepository.Object);
    }

    private static PriorPackageSemanticContextFixture CreateFixture(bool includeUnknownSentinels = false)
    {
        Guid priorRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ArchitectureRequest priorRequest = new()
        {
            Description = "Prior regulated workload",
            SystemName = "prior-system",
            DraftActors =
            [
                new ActorDescriptor
                {
                    Label = "Claims adjuster",
                    Kind = ActorKind.Human,
                    TrustOrigin = TrustOrigin.Internal,
                    Contract = InteractionContract.Sync,
                },
            ],
            Assumptions =
            [
                includeUnknownSentinels
                    ? ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview
                    : "Single-region MVP",
            ],
            Constraints =
            [
                includeUnknownSentinels
                    ? ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview
                    : "EU data residency",
            ],
            InlineRequirements =
            [
                includeUnknownSentinels
                    ? ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview
                    : "Reliability: RTO 4 hours",
            ],
        };

        ManifestDocument manifest = new()
        {
            Assumptions = ["Audit logs retained 7 years"],
            Constraints = new ConstraintSection
            {
                MandatoryConstraints =
                [
                    includeUnknownSentinels
                        ? ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview
                        : "Private networking only",
                ],
            },
            Requirements = new RequirementsCoverageSection
            {
                Covered =
                [
                    new RequirementCoverageItem
                    {
                        RequirementName = "encryption-at-rest",
                        RequirementText = "Encrypt data at rest",
                        IsMandatory = true,
                        CoverageStatus = "Covered",
                    },
                ],
            },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-1",
                    Title = "Use private endpoints",
                    Category = "network",
                    SelectedOption = "private-link",
                    Rationale = "Prior review",
                },
            ],
        };

        RunRecord priorRun = new()
        {
            RunId = priorRunId,
            ArchitectureRequestId = "prior-req",
            GoldenManifestId = manifestId,
        };

        return new PriorPackageSemanticContextFixture(
            scope,
            priorRunId,
            manifestId,
            priorRun,
            priorRequest,
            manifest);
    }

    private sealed record PriorPackageSemanticContextFixture(
        ScopeContext Scope,
        Guid PriorRunId,
        Guid ManifestId,
        RunRecord PriorRun,
        ArchitectureRequest PriorRequest,
        ManifestDocument Manifest);
}
