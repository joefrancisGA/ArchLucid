using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>Builds <see cref="GovernanceController"/> instances for unit tests with real application facades.</summary>
internal static class GovernanceControllerTestFactory
{
    public static GovernanceController Create(
        IGovernanceWorkflowFacade? workflowFacade = null,
        IGovernanceApprovalRequestRepository? approvalRepository = null,
        IGovernancePromotionRecordRepository? promotionRepository = null,
        IGovernanceEnvironmentActivationRepository? activationRepository = null,
        IFindingReviewTrailRepository? findingReviewTrailRepository = null,
        IActorContext? actorContext = null,
        IScopeContextProvider? scopeContextProvider = null,
        IRunRepository? runRepository = null,
        IGovernanceDashboardService? dashboardService = null,
        IGovernanceLineageService? lineageService = null,
        IGovernanceRationaleService? rationaleService = null,
        IComplianceDriftTrendService? complianceDriftTrendService = null,
        IPolicyPackDryRunService? policyPackDryRunService = null,
        IPolicyPackGovernanceDryRunService? policyPackGovernanceDryRunService = null,
        IPolicyPackHttpFacade? policyPackHttpFacade = null,
        IPolicyPackSchemaKeysService? policyPackSchemaKeysService = null,
        IAuditService? auditService = null,
        IPolicyPackDraftService? policyPackDraftService = null,
        IPolicyPackGeneratorService? policyPackGeneratorService = null,
        ITenantRepository? tenantRepository = null,
        IGovernanceMutationCorrectionService? mutationCorrectionService = null,
        HttpContext? httpContext = null)
    {
        IScopeContextProvider scope = scopeContextProvider ?? Mock.Of<IScopeContextProvider>();
        IRunRepository runs = runRepository ?? Mock.Of<IRunRepository>();
        IGovernanceWorkflowFacade workflow = workflowFacade ?? Mock.Of<IGovernanceWorkflowFacade>();
        IGovernanceApprovalRequestRepository approvals =
            approvalRepository ?? Mock.Of<IGovernanceApprovalRequestRepository>();

        IGovernanceApprovalRequestsFacade approvalRequestsFacade = new GovernanceApprovalRequestsFacade(
            workflow,
            approvals,
            scope,
            runs);

        IGovernancePromotionsActivationsFacade promotionsActivationsFacade = new GovernancePromotionsActivationsFacade(
            workflow,
            approvals,
            promotionRepository ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepository ?? Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            scope,
            runs);

        IGovernanceInsightsFacade insightsFacade = new GovernanceInsightsFacade(
            dashboardService ?? Mock.Of<IGovernanceDashboardService>(),
            lineageService ?? Mock.Of<IGovernanceLineageService>(),
            rationaleService ?? Mock.Of<IGovernanceRationaleService>(),
            complianceDriftTrendService ?? Mock.Of<IComplianceDriftTrendService>(),
            approvals,
            scope,
            runs);

        IGovernanceMutationCorrectionService mutationCorrection = mutationCorrectionService
            ?? new GovernanceMutationCorrectionService(
            approvals,
            promotionRepository ?? Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepository ?? Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            findingReviewTrailRepository ?? Mock.Of<IFindingReviewTrailRepository>(),
            Mock.Of<IFindingInspectReadRepository>(),
            scope,
            runs,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>(),
            auditService ?? Mock.Of<IAuditService>(),
            NullLogger<GovernanceMutationCorrectionService>.Instance);

        GovernanceController controller = new(
            approvalRequestsFacade,
            promotionsActivationsFacade,
            insightsFacade,
            mutationCorrection,
            actorContext ?? Mock.Of<IActorContext>(),
            scope,
            policyPackDryRunService ?? Mock.Of<IPolicyPackDryRunService>(),
            policyPackGovernanceDryRunService ?? Mock.Of<IPolicyPackGovernanceDryRunService>(),
            policyPackHttpFacade ?? Mock.Of<IPolicyPackHttpFacade>(),
            policyPackSchemaKeysService ?? Mock.Of<IPolicyPackSchemaKeysService>(),
            auditService ?? Mock.Of<IAuditService>(),
            policyPackDraftService ?? Mock.Of<IPolicyPackDraftService>(),
            policyPackGeneratorService ?? Mock.Of<IPolicyPackGeneratorService>(),
            tenantRepository ?? Mock.Of<ITenantRepository>(),
            NullLogger<GovernanceController>.Instance);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext ?? new DefaultHttpContext(),
        };

        return controller;
    }
}
