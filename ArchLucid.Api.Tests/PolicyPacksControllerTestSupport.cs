using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

internal static class PolicyPacksControllerTestSupport
{
    internal static PolicyPacksController CreateController(Mock<IPolicyPackHttpFacade> httpFacade)
    {
        PolicyPacksController controller = new(
            httpFacade.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        return controller;
    }

    internal static void SetupScopeNotFoundDefaults(Mock<IPolicyPackHttpFacade> httpFacade)
    {
        httpFacade
            .Setup(f => f.ListVisiblePacksAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPack>>.ScopeNotFound());
        httpFacade
            .Setup(f => f.GetPageBundleAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPacksPageBundleResponse>.ScopeNotFound());
        httpFacade
            .Setup(f => f.GetEffectiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<EffectivePolicyPackSet>.ScopeNotFound());
        httpFacade
            .Setup(f => f.GetEffectiveContentAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackContentDocument>.ScopeNotFound());
        httpFacade
            .Setup(f => f.ListCatalogAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPackCatalogListItem>>.ScopeNotFound());
        httpFacade
            .Setup(f => f.GetCatalogEntryAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ScopeNotFound });
        httpFacade
            .Setup(f => f.ListWorkspaceSelectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPackWorkspaceSelectionItem>>.ScopeNotFound());
        httpFacade
            .Setup(f => f.ListVersionsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<IReadOnlyList<PolicyPackVersion>>.ScopeNotFound());
        httpFacade
            .Setup(f => f.GetVersionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersionHttpResult { Outcome = PolicyPackVersionLookupOutcome.PackNotFound });
        httpFacade
            .Setup(f => f.ExplainPackMarkdownAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<string> { Outcome = PolicyPackHttpOutcome.ScopeNotFound });
        httpFacade
            .Setup(f => f.PromoteCatalogEntryAsync(It.IsAny<PolicyPackPromoteCatalogBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<PolicyPackCatalogEntryDetail> { Outcome = PolicyPackHttpOutcome.ScopeNotFound });
        httpFacade
            .Setup(f => f.DemoteCatalogEntryAsync(It.IsAny<PolicyPackDemoteCatalogBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackHttpResult<bool> { Outcome = PolicyPackHttpOutcome.ScopeNotFound });
        httpFacade
            .Setup(f => f.CreatePackAsync(It.IsAny<PolicyPackCreateBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPack>.ScopeNotFound());
        httpFacade
            .Setup(f => f.PublishVersionAsync(It.IsAny<Guid>(), It.IsAny<PolicyPackPublishBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackVersion>.ScopeNotFound());
        httpFacade
            .Setup(f => f.AssignAsync(It.IsAny<Guid>(), It.IsAny<PolicyPackAssignBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackAssignHttpResult { Outcome = PolicyPackHttpOutcome.ScopeNotFound });
        httpFacade
            .Setup(f => f.ArchiveAssignmentAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<bool>.ScopeNotFound());
        httpFacade
            .Setup(f => f.SoftDeletePackAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<bool>.ScopeNotFound());
        httpFacade
            .Setup(f => f.DuplicatePackAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPack>.ScopeNotFound());
        httpFacade
            .Setup(f => f.SetAssignmentEnabledAsync(It.IsAny<Guid>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<bool>.ScopeNotFound());
        httpFacade
            .Setup(f => f.SimulateAsync(
                It.IsAny<PolicyPackContentDocument>(),
                It.IsAny<string>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackGovernanceDryRunResult>.ScopeNotFound());
        httpFacade
            .Setup(f => f.SimulateBulkAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<bool?>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackSimulateBulkSummary>.ScopeNotFound());
        httpFacade
            .Setup(f => f.ValidateContentAsync(It.IsAny<System.Text.Json.JsonElement>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackContentValidationResponse>.ScopeNotFound());
    }
}
