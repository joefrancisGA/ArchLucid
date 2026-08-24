using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureSynthesisKernelTests
{
    [Fact]
    public async Task DraftAsync_forwards_to_draft_service()
    {
        DraftArchitectureRequestInput input = new() { FreeTextDescription = "enough characters here" };
        DraftArchitectureRequestResponse expected = new() { SuggestedConstraints = ["c1"] };
        Mock<IArchitectureRequestDraftService> draft = new();
        draft
            .Setup(s => s.DraftAsync(input, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        ArchitectureSynthesisKernel sut = CreateSut(draftService: draft.Object);

        DraftArchitectureRequestResponse actual = await sut.DraftAsync(input, CancellationToken.None);

        actual.Should().BeSameAs(expected);
        draft.Verify(s => s.DraftAsync(input, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GenerateAsync_persists_Created_origin_run_without_commit_ready_agent_results()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-synth-1",
            SystemName = "SynthSystem",
            Description = "Created-origin generate without review agents",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture
        };
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IRunRepository> runs = new();
        RunRecord? saved = null;
        runs
            .Setup(r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Callback((RunRecord record, CancellationToken _, System.Data.IDbConnection? _, System.Data.IDbTransaction? _) =>
                saved = record)
            .Returns(Task.CompletedTask);

        FakeTimeProvider time = new(new DateTimeOffset(2026, 8, 18, 12, 0, 0, TimeSpan.Zero));
        ArchitectureSynthesisKernel sut = CreateSut(
            requestRepository: requests.Object,
            runRepository: runs.Object,
            scopeProvider: scopeProvider.Object,
            contentSafety: safety.Object,
            timeProvider: time);

        ArchitectureSynthesisGenerateResult result =
            await sut.GenerateAsync(request, idempotency: null, CancellationToken.None);

        result.PackageOrigin.Should().Be(ArchitecturePackageOrigin.Created);
        result.RunId.Should().HaveLength(32);
        saved.Should().NotBeNull();
        saved!.PackageOrigin.Should().Be(ArchitecturePackageOrigin.Created);
        saved.LegacyRunStatus.Should().Be(nameof(ArchitectureRunStatus.Created));
        saved.ArchitectureRequestId.Should().Be(request.RequestId);
        requests.Verify(
            r => r.CreateAsync(
                request,
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);
        runs.Verify(
            r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()),
            Times.Once);
    }

    [Fact]
    public async Task GenerateAsync_does_not_require_Critic_or_other_review_agent_results()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-synth-no-critic",
            SystemName = "NoCritic",
            Description = "Generate success is not four-agent commit-ready",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture
        };

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        ArchitectureSynthesisKernel sut = CreateSut(
            requestRepository: requests.Object,
            runRepository: runs.Object,
            contentSafety: safety.Object);

        ArchitectureSynthesisGenerateResult result =
            await sut.GenerateAsync(request, idempotency: null, CancellationToken.None);

        result.PackageOrigin.Should().Be(ArchitecturePackageOrigin.Created);
        result.RunId.Should().NotBeNullOrWhiteSpace();
        string source = await File.ReadAllTextAsync(
            Path.Combine(RepoRoot(), "ArchLucid.Application", "Architecture", "ArchitectureSynthesisKernel.cs"));
        source.Should().NotContain("EnsureCommitReadyAgentResults");
        source.Should().NotContain("HasCommitReadyAgentResults");
    }

    [Fact]
    public async Task GenerateAsync_persists_knowledge_model_when_persistence_is_available()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ArchitectureRequest request = new()
        {
            RequestId = "req-synth-model",
            SystemName = "ModelSystem",
            Description = "Created-origin generate with knowledge model",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
            Constraints = ["Must use managed identity"],
        };

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        InMemoryArchitectureIntelligencePersistence persistence = new();
        ArchitectureKnowledgeModelIntakeBuilder intakeBuilder = new(TimeProvider.System);

        ArchitectureSynthesisKernel sut = CreateSut(
            requestRepository: requests.Object,
            runRepository: runs.Object,
            scopeProvider: scopeProvider.Object,
            contentSafety: safety.Object,
            knowledgeModelIntakeBuilder: intakeBuilder,
            architectureIntelligencePersistence: persistence);

        ArchitectureSynthesisGenerateResult result =
            await sut.GenerateAsync(request, idempotency: null, CancellationToken.None);

        result.KnowledgeModelId.Should().NotBeNullOrWhiteSpace();
        ArchitectureKnowledgeModel? saved =
            await persistence.GetModelAsync(
                scope.TenantId.ToString("D"),
                result.KnowledgeModelId!,
                CancellationToken.None);
        saved.Should().NotBeNull();
        saved!.Elements.Should().Contain(e => e.Kind == ArchitectureElementKind.Constraint);
    }

    [Fact]
    public async Task GenerateAsync_seeds_technology_ledger_from_intake()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-synth-ledger",
            SystemName = "LedgerSystem",
            Description = "Created-origin generate seeds technology ledger",
            CloudProvider = CloudProvider.Azure,
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
        };

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        InMemoryTechnologyLedgerRepository ledger = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ArchitectureSynthesisKernel sut = CreateSut(
            requestRepository: requests.Object,
            runRepository: runs.Object,
            scopeProvider: scopeProvider.Object,
            contentSafety: safety.Object,
            technologyLedgerRequestSeeder: TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(ledger),
            technologyLedgerEvidenceSeeder: TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(ledger, scopeProvider.Object));

        ArchitectureSynthesisGenerateResult result =
            await sut.GenerateAsync(request, idempotency: null, CancellationToken.None);

        IReadOnlyList<ArchLucid.Contracts.Persistence.TechnologyLedger.TechnologyLedgerEntry> entries =
            await ledger.GetByRunIdAsync(scope, result.RunId, CancellationToken.None);

        entries.Should().ContainSingle(e => e.Role == ArchLucid.Contracts.Persistence.TechnologyLedger.TechnologyLedgerRole.CloudPlatform);
    }

    private static ArchitectureSynthesisKernel CreateSut(
        IArchitectureRequestDraftService? draftService = null,
        IArchitectureRequestRepository? requestRepository = null,
        IRunRepository? runRepository = null,
        IScopeContextProvider? scopeProvider = null,
        IRequestContentSafetyPrecheck? contentSafety = null,
        IArchitectureKnowledgeModelIntakeBuilder? knowledgeModelIntakeBuilder = null,
        IArchitectureIntelligencePersistence? architectureIntelligencePersistence = null,
        TechnologyLedgerRequestSeeder? technologyLedgerRequestSeeder = null,
        TechnologyLedgerEvidenceSeeder? technologyLedgerEvidenceSeeder = null,
        TimeProvider? timeProvider = null)
    {
        Mock<IScopeContextProvider> defaultScope = new();
        defaultScope.Setup(p => p.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        return new ArchitectureSynthesisKernel(
            draftService ?? Mock.Of<IArchitectureRequestDraftService>(),
            requestRepository ?? Mock.Of<IArchitectureRequestRepository>(),
            runRepository ?? Mock.Of<IRunRepository>(),
            scopeProvider ?? defaultScope.Object,
            contentSafety ?? Mock.Of<IRequestContentSafetyPrecheck>(),
            WorkspaceSystemNameCollisionGuardTestDoubles.NoOp(),
            knowledgeModelIntakeBuilder ?? new ArchitectureKnowledgeModelIntakeBuilder(TimeProvider.System),
            architectureIntelligencePersistence,
            technologyLedgerRequestSeeder
            ?? TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(
                Mock.Of<ArchLucid.Persistence.Data.Repositories.ITechnologyLedgerRepository>()),
            technologyLedgerEvidenceSeeder
            ?? TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(
                Mock.Of<ArchLucid.Persistence.Data.Repositories.ITechnologyLedgerRepository>(),
                scopeProvider ?? defaultScope.Object),
            NullLogger<ArchitectureSynthesisKernel>.Instance,
            timeProvider ?? TimeProvider.System);
    }

    private static string RepoRoot() =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
}
