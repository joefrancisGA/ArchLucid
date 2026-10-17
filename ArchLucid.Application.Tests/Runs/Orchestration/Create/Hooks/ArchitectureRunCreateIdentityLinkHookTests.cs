using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Orchestration.Create.Hooks;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Create.Hooks;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateIdentityLinkHookTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public void Constructor_throws_when_knowledge_model_access_is_null()
    {
        Action act = () => _ = new ArchitectureRunCreateIdentityLinkHook(
            Mock.Of<IArchitectureIdentityService>(),
            Mock.Of<IArchitectureVersionService>(),
            Mock.Of<IScopeContextProvider>(),
            null!);

        act.Should().Throw<ArgumentNullException>()
            .WithParameterName("architectureKnowledgeModelAccess");
    }

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_pins_version_when_greenfield_identity_is_minted()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(s => s.TryEnsureReviewRunLinkedAsync(
                Scope,
                reviewRunId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        Mock<IArchitectureVersionService> versionService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            versionService.Object,
            scopeProvider.Object,
            Mock.Of<IArchitectureKnowledgeModelAccess>());

        await sut.TryLinkReviewRunArchitectureIdentityAsync(request, reviewRunId.ToString("N"), CancellationToken.None);

        versionService.Verify(
            s => s.EnsureRunVersionPinnedAsync(
                Scope,
                reviewRunId,
                architectureId,
                request,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_pins_saved_knowledge_model_when_closed_loop_already_persisted()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });
        ArchitectureKnowledgeModel knowledgeModel = new()
        {
            ModelId = "model-closed-loop",
            TenantId = Scope.TenantId.ToString("D"),
            SchemaVersion = 1,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "App Service",
                },
            ],
        };

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(s => s.TryEnsureReviewRunLinkedAsync(
                Scope,
                reviewRunId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(access => access.GetForRunAsync(Scope, reviewRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(knowledgeModel);

        Mock<IArchitectureVersionService> versionService = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            versionService.Object,
            scopeProvider.Object,
            knowledgeModelAccess.Object);

        await sut.TryLinkReviewRunArchitectureIdentityAsync(request, reviewRunId.ToString("N"), CancellationToken.None);

        versionService.Verify(
            s => s.EnsureRunVersionPinnedAsync(
                Scope,
                reviewRunId,
                architectureId,
                request,
                knowledgeModel,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_throws_when_identity_cannot_be_resolved()
    {
        Guid reviewRunId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        ArchitectureRequest request = new()
        {
            RequestId = "review-missing-source",
            Description = "Second review whose source architecture cannot be resolved.",
            SystemName = "Platform",
        };

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(s => s.TryEnsureReviewRunLinkedAsync(
                Scope,
                reviewRunId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureIdentityRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            Mock.Of<IArchitectureVersionService>(),
            scopeProvider.Object,
            Mock.Of<IArchitectureKnowledgeModelAccess>());

        Func<Task> act = () => sut.TryLinkReviewRunArchitectureIdentityAsync(
            request,
            reviewRunId.ToString("N"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ArchitecturePinningFailedException>()
            .WithMessage("*identity link failed*");
    }

    [Fact]
    public async Task TryLinkReviewRunArchitectureIdentityAsync_after_closed_loop_save_without_architecture_id_clears_commit_kappa_drift()
    {
        Guid runId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid architectureId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(
            new GoldenCohortItem
            {
                Id = "gc-001",
                Title = "Baseline Azure web workload (single region)",
            });
        ArchitectureKnowledgeModel knowledgeModel = new()
        {
            ModelId = "model-intake",
            TenantId = Scope.TenantId.ToString("D"),
            SchemaVersion = 1,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-app",
                    Kind = ArchitectureElementKind.Component,
                    Name = "closed-loop-component",
                },
            ],
        };

        InMemoryArchitectureRequestRepository requests = new();
        await requests.CreateAsync(request, CancellationToken.None);

        InMemoryRunRepository runs = new();
        RunRecord header = new()
        {
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            RunId = runId,
            ArchitectureRequestId = request.RequestId,
            ProjectId = request.SystemName,
        };
        await runs.SaveAsync(header, CancellationToken.None);

        InMemoryArchitectureVersionRepository versions = new();
        ArchitectureVersionService versionService = new(
            versions,
            runs,
            NullLogger<ArchitectureVersionService>.Instance,
            TimeProvider.System);
        ArchitectureVersionKnowledgeModelPinSync pinSync = new(versionService, requests);
        InMemoryArchitectureIntelligencePersistence persistence = new();
        ArchitectureKnowledgeModelAccess knowledgeModelAccess = new(
            persistence,
            runs,
            architectureIdentityRepository: null,
            knowledgeModelGraphReprojector: null,
            pinSync);

        await knowledgeModelAccess.SaveForRunAsync(Scope, runId, knowledgeModel, CancellationToken.None);

        header = (await runs.GetByIdAsync(Scope, runId, CancellationToken.None))!;
        ArchitectureVersionContentFingerprintVerifier.GetViolations(
                new ArchitectureVersionRecord
                {
                    ContentHashSha256 = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel: null),
                },
                request,
                (await knowledgeModelAccess.GetForRunAsync(Scope, runId, CancellationToken.None))!)
            .Should()
            .ContainSingle(static reason => reason.Contains("κ drift", StringComparison.Ordinal));

        Mock<IArchitectureIdentityService> identityService = new();
        identityService
            .Setup(service => service.TryEnsureReviewRunLinkedAsync(
                Scope,
                runId,
                request,
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord { ArchitectureId = architectureId });

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        ArchitectureRunCreateIdentityLinkHook sut = new(
            identityService.Object,
            versionService,
            scopeProvider.Object,
            knowledgeModelAccess);

        await sut.TryLinkReviewRunArchitectureIdentityAsync(request, runId.ToString("N"), CancellationToken.None);

        RunRecord? pinnedHeader = await runs.GetByIdAsync(Scope, runId, CancellationToken.None);
        pinnedHeader.Should().NotBeNull();
        pinnedHeader!.ArchitectureVersionId.Should().NotBeNull();

        ArchitectureVersionRecord? pinned = await versions.GetByIdAsync(
            Scope,
            pinnedHeader.ArchitectureVersionId!.Value,
            CancellationToken.None);
        ArchitectureKnowledgeModel? savedModel = await knowledgeModelAccess.GetForRunAsync(
            Scope,
            runId,
            CancellationToken.None);

        pinned.Should().NotBeNull();
        savedModel.Should().NotBeNull();
        ArchitectureVersionContentFingerprintVerifier.GetViolations(pinned!, request, savedModel)
            .Should()
            .BeEmpty();
    }
}
