using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Caching;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using DecisioningManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;

namespace ArchLucid.Application.Tests.Orchestration;

/// <summary>
///     First-create finalize must not require a committed golden manifest in the authority read model.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AuthorityCommittedPipelineFinalizerTests
{
    [Fact]
    public async Task FinalizeAsync_does_not_query_sealed_golden_manifest_during_first_create()
    {
        ScopeContext scope = CreateScope();
        Guid runId = Guid.Parse("7cef4ce2-f677-44d6-998b-9fc9bfed4b0f");
        Guid contextSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid findingsSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid decisionTraceId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        RunRecord run = CreateRun(runId, scope);
        ManifestDocument manifest = CreateManifest(
            scope,
            runId,
            contextSnapshotId,
            findingsSnapshotId,
            decisionTraceId,
            manifestId);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        AuthorityCommittedPipelineFinalizer sut = CreateFinalizer(authorityQuery.Object, CreateRunRepository(scope));
        Mock<IArchLucidUnitOfWork> uow = CreateUnitOfWork();

        RunRecord completed = await sut.FinalizeAsync(
            run,
            CreateContextSnapshot(runId, contextSnapshotId),
            CreateFindingsSnapshot(runId, contextSnapshotId, findingsSnapshotId),
            manifest,
            CreateTrace(scope, runId, decisionTraceId),
            scope,
            uow.Object,
            CancellationToken.None);

        completed.RunId.Should().Be(runId);
        authorityQuery.Verify(
            query => query.GetRunDetailForManifestCompareAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        uow.Verify(work => work.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static AuthorityCommittedPipelineFinalizer CreateFinalizer(
        IAuthorityQueryService authorityQuery,
        IRunRepository runRepository)
    {
        Mock<IRetrievalIndexingOutboxRepository> retrievalOutbox = new();
        retrievalOutbox
            .Setup(outbox => outbox.EnqueueAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventPublisher> publisher = new();
        publisher
            .Setup(events => events.PublishAsync(
                It.IsAny<string>(),
                It.IsAny<ReadOnlyMemory<byte>>(),
                It.IsAny<string?>(),
                It.IsAny<IReadOnlyDictionary<string, object>?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IIntegrationEventOutboxRepository> outbox = new();
        Mock<IOptionsMonitor<IntegrationEventsOptions>> integrationOptions = new();
        integrationOptions
            .Setup(monitor => monitor.CurrentValue)
            .Returns(new IntegrationEventsOptions { TransactionalOutboxEnabled = false });

        Mock<IOptionsMonitor<PublicSiteOptions>> publicSite = new();
        publicSite.Setup(monitor => monitor.CurrentValue).Returns(new PublicSiteOptions());

        Mock<IManifestHashService> manifestHash = new();
        manifestHash.Setup(service => service.ComputeHash(It.IsAny<ManifestDocument>())).Returns("sha256:pipeline");

        Mock<IAuditService> audit = new();
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new AuthorityCommittedPipelineFinalizer(
            runRepository,
            retrievalOutbox.Object,
            publisher.Object,
            outbox.Object,
            integrationOptions.Object,
            publicSite.Object,
            NonCachingGraphSnapshotProjectionCache.Instance,
            authorityQuery,
            manifestHash.Object,
            audit.Object,
            NullLogger<AuthorityCommittedPipelineFinalizer>.Instance);
    }

    private static Mock<IArchLucidUnitOfWork> CreateUnitOfWork()
    {
        Mock<IArchLucidUnitOfWork> uow = new();
        uow.SetupGet(work => work.SupportsExternalTransaction).Returns(false);
        uow.Setup(work => work.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        return uow;
    }

    private static IRunRepository CreateRunRepository(ScopeContext scope)
    {
        Mock<IRunRepository> runRepo = new();
        runRepo
            .Setup(repo => repo.ListByProjectAsync(
                scope,
                It.IsAny<string>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        return runRepo.Object;
    }

    private static ScopeContext CreateScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
    }

    private static RunRecord CreateRun(Guid runId, ScopeContext scope)
    {
        return new RunRecord
        {
            RunId = runId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            ProjectId = "CustomerWebApp",
            Description = "Greenfield customer-facing web application with authenticated APIs.",
            LegacyRunStatus = nameof(ArchitectureRunStatus.Created),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
    }

    private static ContextSnapshot CreateContextSnapshot(Guid runId, Guid snapshotId)
    {
        return new ContextSnapshot
        {
            SnapshotId = snapshotId,
            RunId = runId,
            ProjectId = "CustomerWebApp",
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
    }

    private static FindingsSnapshot CreateFindingsSnapshot(Guid runId, Guid contextSnapshotId, Guid findingsSnapshotId)
    {
        return new FindingsSnapshot
        {
            FindingsSnapshotId = findingsSnapshotId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            Findings = [],
        };
    }

    private static DecisionTraceDto CreateTrace(ScopeContext scope, Guid runId, Guid decisionTraceId)
    {
        return RuleAuditTraceDto.From(
            new RuleAuditTracePayload
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DecisionTraceId = decisionTraceId,
                RunId = runId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                RuleSetId = "rs",
                RuleSetVersion = "1",
                RuleSetHash = "h",
            });
    }

    private static ManifestDocument CreateManifest(
        ScopeContext scope,
        Guid runId,
        Guid contextSnapshotId,
        Guid findingsSnapshotId,
        Guid decisionTraceId,
        Guid manifestId)
    {
        return new ManifestDocument
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshotId = Guid.Parse("55555555-5555-5555-5555-555555555555"),
            FindingsSnapshotId = findingsSnapshotId,
            DecisionTraceId = decisionTraceId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "sha256:pipeline-precomputed",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rsh",
            Metadata = new DecisioningManifestMetadata { Name = "first-create-finalize" },
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection(),
            Assumptions = [],
            Warnings = [],
            Provenance = new ManifestProvenance(),
            Decisions = [],
        };
    }
}
