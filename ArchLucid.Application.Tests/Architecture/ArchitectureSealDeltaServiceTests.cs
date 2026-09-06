using ArchLucid.Application.Architecture;
using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureSealDeltaServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public async Task GetSealDeltaAsync_one_edited_assumption_returns_changed_row()
    {
        Guid architectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid sealedManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid draftId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid sealedReviewRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        const string sharedAssumption = "Traffic stays regional";
        const string draftOnlyAssumption = "Multi-region failover required";

        ArchitectureIdentityDetail detail = new()
        {
            ArchitectureId = architectureId,
            LatestSealedManifestId = sealedManifestId,
            CurrentDraftId = draftId,
            LatestReviewId = sealedReviewRunId,
        };

        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(r => r.GetDetailAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        ManifestDocument sealedManifest = new()
        {
            ManifestId = sealedManifestId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            Assumptions = [sharedAssumption],
            FeasibilityVerdict = new FeasibilityVerdict
            {
                TransparencyTrail = new TransparencyTrail
                {
                    Asserted =
                    [
                        new AssertedTrailEntry { Key = "cloudTarget", Value = "Azure" },
                    ],
                },
            },
        };

        Mock<IGoldenManifestRepository> manifestRepository = new();
        manifestRepository
            .Setup(r => r.GetByIdAsync(Scope, sealedManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(sealedManifest);

        DraftRequestDocument draftDocument = new()
        {
            FreeTextIntent = "Extend the platform for multi-region resilience.",
            StructuredBrief = new ArchitectureDraftStructuredBrief
            {
                ConfirmedAssumptions = [draftOnlyAssumption],
            },
            TransparencyTrail = new TransparencyTrail
            {
                Asserted =
                [
                    new AssertedTrailEntry { Key = "cloudTarget", Value = "Azure and AWS" },
                ],
            },
        };

        Mock<IDraftRequestRepository> draftRepository = new();
        draftRepository
            .Setup(r => r.GetAsync(
                Scope.TenantId,
                Scope.WorkspaceId,
                Scope.ProjectId,
                draftId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = draftId,
                Document = draftDocument,
            });

        DraftRequestProjector projector = new();

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetCommittedRunIdByGoldenManifestIdAsync(
                Scope,
                architectureId,
                sealedManifestId,
                Guid.Empty,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(sealedReviewRunId);

        ArchitectureSealDeltaService sut = new(
            identityRepository.Object,
            manifestRepository.Object,
            draftRepository.Object,
            projector,
            runRepository.Object);

        ArchitectureSealDeltaResponse? result = await sut.GetSealDeltaAsync(Scope, architectureId);

        result.Should().NotBeNull();
        result!.HasPriorSeal.Should().BeTrue();
        result.LatestSealedReviewRunId.Should().Be(sealedReviewRunId);
        result.Diffs.Should().Contain(d =>
            d.Section == "Assumptions"
            && d.DiffKind == "Added"
            && d.Key == draftOnlyAssumption);
        result.Diffs.Should().Contain(d =>
            d.Section == "Asserted"
            && d.DiffKind == "Changed"
            && d.Key == "cloudTarget");
        result.EmptyStateCopy.Should().BeNull();
    }

    [Fact]
    public async Task GetSealDeltaAsync_without_prior_seal_returns_honest_empty_state()
    {
        Guid architectureId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        Mock<IArchitectureIdentityRepository> identityRepository = new();
        identityRepository
            .Setup(r => r.GetDetailAsync(Scope, architectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityDetail { ArchitectureId = architectureId });

        ArchitectureSealDeltaService sut = new(
            identityRepository.Object,
            Mock.Of<IGoldenManifestRepository>(),
            Mock.Of<IDraftRequestRepository>(),
            new DraftRequestProjector(),
            Mock.Of<IRunRepository>());

        ArchitectureSealDeltaResponse? result = await sut.GetSealDeltaAsync(Scope, architectureId);

        result.Should().NotBeNull();
        result!.HasPriorSeal.Should().BeFalse();
        result.EmptyStateCopy.Should().Be(ArchitectureSealDeltaHonesty.NoPriorSeal);
        result.Diffs.Should().BeEmpty();
    }
}
