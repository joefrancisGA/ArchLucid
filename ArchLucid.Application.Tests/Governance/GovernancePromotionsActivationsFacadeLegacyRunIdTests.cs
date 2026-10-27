using ArchLucid.Application.Analysis;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernancePromotionsActivationsFacadeLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_ListPromotionsByRunIdAsync_merges_promotions_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryRunRepository runRepository = new();
        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runGuid,
                ProjectId = "gov-test",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        GovernancePromotionRecord legacyPromotion = new()
        {
            PromotionRecordId = "promo-facade-legacy",
            RunId = legacyUpper,
            PromotedUtc = DateTime.UtcNow,
        };

        Mock<IGovernancePromotionRecordRepository> promotionRepository = new();
        promotionRepository
            .Setup(repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyPromotion]);

        GovernancePromotionsActivationsFacade facade = new(
            Mock.Of<IGovernanceWorkflowFacade>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            promotionRepository.Object,
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            scopeProvider.Object,
            runRepository);

        IReadOnlyList<GovernancePromotionRecord> promotions =
            await facade.ListPromotionsByRunIdAsync(runGuid.ToString("D"), CancellationToken.None);

        promotions.Should().ContainSingle(promo => promo.PromotionRecordId == "promo-facade-legacy");
        promotionRepository.Verify(
            repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task CompareQuality_ListApprovalRequestsByRunIdAsync_merges_approvals_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryRunRepository runRepository = new();
        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runGuid,
                ProjectId = "gov-test",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        GovernanceApprovalRequest legacyApproval = new()
        {
            ApprovalRequestId = "approval-facade-legacy",
            RunId = legacyUpper,
            RequestedUtc = DateTime.UtcNow,
        };

        Mock<IGovernanceApprovalRequestRepository> approvalRepository = new();
        approvalRepository
            .Setup(repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyApproval]);

        GovernancePromotionsActivationsFacade facade = new(
            Mock.Of<IGovernanceWorkflowFacade>(),
            approvalRepository.Object,
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            scopeProvider.Object,
            runRepository);

        IReadOnlyList<GovernanceApprovalRequest> approvals =
            await facade.ListApprovalRequestsByRunIdAsync(runGuid.ToString("D"), CancellationToken.None);

        approvals.Should().ContainSingle(req => req.ApprovalRequestId == "approval-facade-legacy");
        approvalRepository.Verify(
            repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task CompareQuality_ListActivationsByRunIdAsync_merges_activations_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        InMemoryRunRepository runRepository = new();
        await runRepository.SaveAsync(
            new RunRecord
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                RunId = runGuid,
                ProjectId = "gov-test",
                CreatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        GovernanceEnvironmentActivation legacyActivation = new()
        {
            ActivationId = "activation-facade-legacy",
            RunId = legacyUpper,
            ActivatedUtc = DateTime.UtcNow,
        };

        Mock<IGovernanceEnvironmentActivationRepository> activationRepository = new();
        activationRepository
            .Setup(repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyActivation]);

        GovernancePromotionsActivationsFacade facade = new(
            Mock.Of<IGovernanceWorkflowFacade>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            activationRepository.Object,
            scopeProvider.Object,
            runRepository);

        IReadOnlyList<GovernanceEnvironmentActivation> activations =
            await facade.ListActivationsByRunIdAsync(runGuid.ToString("D"), CancellationToken.None);

        activations.Should().ContainSingle(act => act.ActivationId == "activation-facade-legacy");
        activationRepository.Verify(
            repository => repository.GetByRunIdAsync(canonicalRunId, It.IsAny<CancellationToken>()),
            Times.AtLeastOnce);
    }
}
