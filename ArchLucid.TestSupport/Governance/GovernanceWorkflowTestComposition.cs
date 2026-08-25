using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Governance.Workflow.Stages;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;

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
        IArchLucidUnitOfWorkFactory unitOfWorkFactory)
    {
        (GovernanceWorkflowAuditSupport auditSupport, GovernanceWorkflowIntegrationEventSupport integrationEvents) =
            CreateSupport(durableAudit, scopeContextProvider, integrationEventOutbox, integrationEventPublisher, integrationEventsOptions);

        return new GovernanceWorkflowFacade(
            new GovernanceWorkflowSubmitStage(
                approvalRepo,
                runDetailQueryService,
                baselineMutationAudit,
                auditSupport,
                integrationEvents,
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
                approvalRepo,
                promotionRepo,
                runDetailQueryService,
                baselineMutationAudit,
                auditSupport,
                unitOfWorkFactory,
                NullLogger<GovernanceWorkflowPromoteStage>.Instance),
            new GovernanceWorkflowActivateStage(
                activationRepo,
                runDetailQueryService,
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
        IArchLucidUnitOfWorkFactory unitOfWorkFactory) =>
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
            unitOfWorkFactory));

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
            NullLogger<GovernanceWorkflowIntegrationEventSupport>.Instance);

        return (auditSupport, integrationEvents);
    }
}
