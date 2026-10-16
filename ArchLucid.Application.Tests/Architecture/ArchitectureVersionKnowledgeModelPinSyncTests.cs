using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureVersionKnowledgeModelPinSyncTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    [Fact]
    public void Constructor_throws_when_version_service_is_null()
    {
        Action act = () => _ = new ArchitectureVersionKnowledgeModelPinSync(
            null!,
            Mock.Of<IArchitectureRequestRepository>());

        act.Should().Throw<ArgumentNullException>().WithParameterName("architectureVersionService");
    }

    [Fact]
    public void Constructor_throws_when_request_repository_is_null()
    {
        Action act = () => _ = new ArchitectureVersionKnowledgeModelPinSync(
            Mock.Of<IArchitectureVersionService>(),
            null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("architectureRequestRepository");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_throws_when_scope_is_null()
    {
        ArchitectureVersionKnowledgeModelPinSync sut = new(
            Mock.Of<IArchitectureVersionService>(),
            Mock.Of<IArchitectureRequestRepository>());

        Func<Task> act = () => sut.SyncPinnedVersionToSavedModelAsync(
            null!,
            new RunRecord { RunId = Guid.NewGuid() },
            new ArchitectureKnowledgeModel());

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("scope");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_throws_when_run_is_null()
    {
        ArchitectureVersionKnowledgeModelPinSync sut = new(
            Mock.Of<IArchitectureVersionService>(),
            Mock.Of<IArchitectureRequestRepository>());

        Func<Task> act = () => sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            null!,
            new ArchitectureKnowledgeModel());

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("run");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_throws_when_knowledge_model_is_null()
    {
        ArchitectureVersionKnowledgeModelPinSync sut = new(
            Mock.Of<IArchitectureVersionService>(),
            Mock.Of<IArchitectureRequestRepository>());

        Func<Task> act = () => sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord { RunId = Guid.NewGuid() },
            null!);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("knowledgeModel");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_noops_when_architecture_id_is_missing()
    {
        Mock<IArchitectureVersionService> versions = new(MockBehavior.Strict);
        Mock<IArchitectureRequestRepository> requests = new(MockBehavior.Strict);
        ArchitectureVersionKnowledgeModelPinSync sut = new(versions.Object, requests.Object);

        await sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord { RunId = Guid.NewGuid() },
            new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

        versions.VerifyNoOtherCalls();
        requests.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_noops_when_architecture_id_is_empty()
    {
        Mock<IArchitectureVersionService> versions = new(MockBehavior.Strict);
        Mock<IArchitectureRequestRepository> requests = new(MockBehavior.Strict);
        ArchitectureVersionKnowledgeModelPinSync sut = new(versions.Object, requests.Object);

        await sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord { RunId = Guid.NewGuid(), ArchitectureId = Guid.Empty },
            new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

        versions.VerifyNoOtherCalls();
        requests.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_throws_when_architecture_request_id_is_missing()
    {
        ArchitectureVersionKnowledgeModelPinSync sut = new(
            Mock.Of<IArchitectureVersionService>(),
            Mock.Of<IArchitectureRequestRepository>());

        Func<Task> act = () => sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                ArchitectureId = Guid.NewGuid(),
            },
            new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*missing ArchitectureRequestId*");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_throws_when_architecture_request_is_missing()
    {
        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync("req-missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        ArchitectureVersionKnowledgeModelPinSync sut = new(
            Mock.Of<IArchitectureVersionService>(),
            requests.Object);

        Func<Task> act = () => sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                ArchitectureId = Guid.NewGuid(),
                ArchitectureRequestId = "req-missing",
            },
            new ArchitectureKnowledgeModel { TenantId = TestScope.TenantId.ToString("D") });

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*architecture request was not found*");
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_pins_version_with_saved_knowledge_model()
    {
        Guid runId = Guid.NewGuid();
        Guid architectureId = Guid.NewGuid();
        ArchitectureRequest request = new()
        {
            RequestId = "req-pin-sync",
            SystemName = "GoldenCohort_gc-001",
            Description = "Intake body used at create-time pin.",
        };
        ArchitectureKnowledgeModel knowledgeModel = CreateKnowledgeModel("api-app");

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IArchitectureVersionService> versions = new();
        versions
            .Setup(service => service.EnsureRunVersionPinnedAsync(
                TestScope,
                runId,
                architectureId,
                request,
                knowledgeModel,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureVersionRecord { ArchitectureVersionId = Guid.NewGuid() });

        ArchitectureVersionKnowledgeModelPinSync sut = new(versions.Object, requests.Object);

        await sut.SyncPinnedVersionToSavedModelAsync(
            TestScope,
            new RunRecord
            {
                RunId = runId,
                ArchitectureId = architectureId,
                ArchitectureRequestId = request.RequestId,
            },
            knowledgeModel);

        versions.Verify(
            service => service.EnsureRunVersionPinnedAsync(
                TestScope,
                runId,
                architectureId,
                request,
                knowledgeModel,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SyncPinnedVersionToSavedModelAsync_after_intake_pin_clears_commit_kappa_drift()
    {
        Guid runId = Guid.NewGuid();
        Guid architectureId = Guid.NewGuid();
        ArchitectureRequest request = new()
        {
            RequestId = "req-intake-then-kappa",
            SystemName = "GoldenCohort_gc-001",
            Description = "Create-time intake used for the first architecture version hash.",
        };
        ArchitectureKnowledgeModel knowledgeModel = CreateKnowledgeModel("closed-loop-component");

        InMemoryArchitectureRequestRepository requests = new();
        await requests.CreateAsync(request, CancellationToken.None);

        InMemoryArchitectureVersionRepository versions = new();
        Mock<IRunRepository> runs = new();
        RunRecord header = new()
        {
            TenantId = TestScope.TenantId,
            WorkspaceId = TestScope.WorkspaceId,
            ScopeProjectId = TestScope.ProjectId,
            RunId = runId,
            ArchitectureId = architectureId,
            ArchitectureRequestId = request.RequestId,
            ProjectId = request.SystemName,
        };

        runs.Setup(repository => repository.GetByIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        runs.Setup(repository => repository.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask)
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) =>
                {
                    header.ArchitectureVersionId = record.ArchitectureVersionId;
                    header.PinnedArchitectureVersionContentHashSha256 =
                        record.PinnedArchitectureVersionContentHashSha256;
                });

        ArchitectureVersionService versionService = new(
            versions,
            runs.Object,
            NullLogger<ArchitectureVersionService>.Instance,
            TimeProvider.System);

        ArchitectureVersionRecord intakePin = await versionService.EnsureRunVersionPinnedAsync(
            TestScope,
            runId,
            architectureId,
            request,
            knowledgeModel: null,
            CancellationToken.None);

        ArchitectureVersionContentFingerprintVerifier.GetViolations(intakePin, request, knowledgeModel)
            .Should()
            .ContainSingle(static reason => reason.Contains("κ drift", StringComparison.Ordinal));

        ArchitectureVersionKnowledgeModelPinSync sut = new(versionService, requests);
        await sut.SyncPinnedVersionToSavedModelAsync(TestScope, header, knowledgeModel, CancellationToken.None);

        ArchitectureVersionRecord? pinned = await versions.GetByIdAsync(
            TestScope,
            header.ArchitectureVersionId!.Value,
            CancellationToken.None);

        pinned.Should().NotBeNull();
        pinned!.ArchitectureVersionId.Should().NotBe(intakePin.ArchitectureVersionId);
        ArchitectureVersionContentFingerprintVerifier.GetViolations(pinned, request, knowledgeModel)
            .Should()
            .BeEmpty();
    }

    private static ArchitectureKnowledgeModel CreateKnowledgeModel(string elementName)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = "model-1",
            TenantId = TestScope.TenantId.ToString("D"),
            SchemaVersion = 1,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "el-1",
                    Kind = ArchitectureElementKind.Component,
                    Name = elementName,
                },
            ],
        };
    }
}
