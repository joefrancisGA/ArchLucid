using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Moq;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.TestSupport.Governance;

/// <summary>
///     Composes governance workflow facade + stages for unit/property tests.
/// </summary>
public static class GovernanceWorkflowTestComposition
{
    public static GovernanceWorkflowFacade CreateFacade(
        IGovernanceApprovalRequestRepository approvalRepo,
        IGovernancePromotionRecordRepository promotionRepo,
        IGovernanceEnvironmentActivationRepository activationRepo,
        IRunDetailQueryService runDetailQueryService,
        IBaselineMutationAuditService baselineMutationAudit,
        IAuditService durableAudit,
        IScopeContextProvider scopeContextProvider,
        IIntegrationEventPublisher integrationEventPublisher,
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        IOptions<PreCommitGovernanceGateOptions> governanceGateOptions,
        IArchLucidUnitOfWorkFactory unitOfWorkFactory,
        IUnifiedGoldenManifestReader? unifiedGoldenManifestReader = null,
        IGovernanceEnvironmentCatalogService? environmentCatalogService = null)
    {
        IUnifiedGoldenManifestReader manifestReader =
            unifiedGoldenManifestReader ?? CreateDefaultUnifiedManifestReader();

        (GovernanceWorkflowAuditSupport auditSupport, GovernanceWorkflowIntegrationEventSupport integrationEvents) =
            CreateSupport(durableAudit, scopeContextProvider, integrationEventOutbox, integrationEventPublisher, integrationEventsOptions);

        IGovernanceEnvironmentCatalogService catalogService =
            environmentCatalogService ?? CreateDefaultEnvironmentCatalogService();

        return new GovernanceWorkflowFacade(
            new GovernanceWorkflowSubmitStage(
                approvalRepo,
                runDetailQueryService,
                manifestReader,
                baselineMutationAudit,
                auditSupport,
                integrationEvents,
                catalogService,
                governanceGateOptions,
                NullLogger<GovernanceWorkflowSubmitStage>.Instance),
            new GovernanceWorkflowReviewStage(
                approvalRepo,
                baselineMutationAudit,
                auditSupport,
                integrationEvents,
                unitOfWorkFactory,
                NullLogger<GovernanceWorkflowReviewStage>.Instance),
            new GovernanceWorkflowPromoteStage(
                new GovernanceWorkflowPromoteValidateStage(
                    approvalRepo,
                    runDetailQueryService,
                    manifestReader,
                    auditSupport,
                    catalogService,
                    NullLogger<GovernanceWorkflowPromoteValidateStage>.Instance),
                new GovernanceWorkflowPromotePersistStage(
                    approvalRepo,
                    promotionRepo,
                    baselineMutationAudit,
                    auditSupport,
                    unitOfWorkFactory,
                    NullLogger<GovernanceWorkflowPromotePersistStage>.Instance)),
            new GovernanceWorkflowActivateStage(
                activationRepo,
                runDetailQueryService,
                manifestReader,
                baselineMutationAudit,
                auditSupport,
                integrationEvents,
                unitOfWorkFactory,
                integrationEventsOptions,
                NullLogger<GovernanceWorkflowActivateStage>.Instance));
    }

    public static GovernanceWorkflowService CreateService(
        IGovernanceApprovalRequestRepository approvalRepo,
        IGovernancePromotionRecordRepository promotionRepo,
        IGovernanceEnvironmentActivationRepository activationRepo,
        IRunDetailQueryService runDetailQueryService,
        IBaselineMutationAuditService baselineMutationAudit,
        IAuditService durableAudit,
        IScopeContextProvider scopeContextProvider,
        IIntegrationEventPublisher integrationEventPublisher,
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        IOptions<PreCommitGovernanceGateOptions> governanceGateOptions,
        IArchLucidUnitOfWorkFactory unitOfWorkFactory,
        IUnifiedGoldenManifestReader? unifiedGoldenManifestReader = null) =>
        new(CreateFacade(
            approvalRepo,
            promotionRepo,
            activationRepo,
            runDetailQueryService,
            baselineMutationAudit,
            durableAudit,
            scopeContextProvider,
            integrationEventPublisher,
            integrationEventOutbox,
            integrationEventsOptions,
            governanceGateOptions,
            unitOfWorkFactory,
            unifiedGoldenManifestReader));

    private static (GovernanceWorkflowAuditSupport, GovernanceWorkflowIntegrationEventSupport) CreateSupport(
        IAuditService durableAudit,
        IScopeContextProvider scopeContextProvider,
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions)
    {
        GovernanceWorkflowAuditSupport auditSupport = new(
            durableAudit,
            scopeContextProvider,
            NullLogger<GovernanceWorkflowAuditSupport>.Instance);

        GovernanceWorkflowIntegrationEventSupport integrationEvents = new(
            scopeContextProvider,
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            NullLogger<GovernanceWorkflowIntegrationEventSupport>.Instance);

        return (auditSupport, integrationEvents);
    }

    private static IGovernanceEnvironmentCatalogService CreateDefaultEnvironmentCatalogService()
    {
        Mock<IGovernanceEnvironmentCatalogService> catalogService = new();
        GovernanceEnvironmentCatalog defaults = GovernanceEnvironmentCatalogDefaults.Create();

        catalogService
            .Setup(service => service.GetCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(defaults);

        catalogService
            .Setup(service => service.GetCatalogAsync(It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(defaults);

        catalogService
            .Setup(service => service.IsValidTransitionAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string source, string target, CancellationToken _) =>
                GovernanceEnvironmentTransitionRules.IsValidTransition(source, target, defaults));

        catalogService
            .Setup(service => service.IsValidTransitionAsync(It.IsAny<ScopeContext>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, string source, string target, CancellationToken __) =>
                GovernanceEnvironmentTransitionRules.IsValidTransition(source, target, defaults));

        return catalogService.Object;
    }

    private static IUnifiedGoldenManifestReader CreateDefaultUnifiedManifestReader()
    {
        Mock<IUnifiedGoldenManifestReader> manifests = new();
        manifests
            .Setup(m => m.GetByVersionAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string version, CancellationToken _) =>
                CreateManifest(ResolveDefaultRunIdForVersion(version), version));

        return manifests.Object;
    }

    private static string ResolveDefaultRunIdForVersion(string version) =>
        version switch
        {
            "v2" => "run-2",
            "v-old" => "run-old",
            "m1" => "r1",
            "m2" => "r2",
            _ => "run-1",
        };

    private static GoldenManifest CreateManifest(string runId, string version) =>
        new()
        {
            RunId = runId,
            SystemName = "Sys",
            Services = [],
            Datastores = [],
            Relationships = [],
            Metadata = new ManifestMetadata { ManifestVersion = version, CreatedUtc = DateTime.UtcNow },
        };

    /// <summary>Run detail with embedded manifest so submit/promote/activate stages skip the unified reader.</summary>
    public static ArchitectureRunDetail CreateRunDetailWithManifest(string runId, string manifestVersion) =>
        new()
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = "req1",
                CurrentManifestVersion = manifestVersion,
            },
            Manifest = CreateManifest(runId, manifestVersion),
        };
}
