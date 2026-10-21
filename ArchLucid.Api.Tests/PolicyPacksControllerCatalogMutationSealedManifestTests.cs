using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Validators;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerCatalogMutationSealedManifestTests
{
    private static readonly ScopeContext CallerScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PromoteCatalogEntry_blocks_mutation_when_latest_committed_run_has_unusable_manifest()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.PromoteCatalogEntryAsync(
                It.IsAny<PolicyPackPromoteCatalogBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackCatalogEntryDetail>.Success(null!));

        PolicyPacksController sut = CreateControllerWithUnusableCommittedRun(httpFacade);

        IActionResult result = await sut.PromoteCatalogEntry(
            new PromotePolicyPackCatalogEntryRequest
            {
                SourcePolicyPackId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Version = "1.0.0",
            },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        httpFacade.Verify(
            facade => facade.PromoteCatalogEntryAsync(
                It.IsAny<PolicyPackPromoteCatalogBody>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Create_blocks_mutation_when_latest_committed_run_has_unusable_manifest()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.CreatePackAsync(It.IsAny<PolicyPackCreateBody>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPack>.Success(null!));

        PolicyPacksController sut = CreateControllerWithUnusableCommittedRun(httpFacade);

        IActionResult result = await sut.Create(
            new CreatePolicyPackRequest
            {
                Name = "baseline",
                Description = "desc",
                PackType = "TenantCustom",
                InitialContentJson = "{}",
            },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        httpFacade.Verify(
            facade => facade.CreatePackAsync(It.IsAny<PolicyPackCreateBody>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Publish_blocks_mutation_when_latest_committed_run_has_unusable_manifest()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.PublishVersionAsync(
                It.IsAny<Guid>(),
                It.IsAny<PolicyPackPublishBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<PolicyPackVersion>.Success(null!));

        PolicyPacksController sut = CreateControllerWithUnusableCommittedRun(httpFacade);

        IActionResult result = await sut.Publish(
            Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            new PublishPolicyPackVersionRequest { Version = "1.0.0", ContentJson = "{}" },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        httpFacade.Verify(
            facade => facade.PublishVersionAsync(
                It.IsAny<Guid>(),
                It.IsAny<PolicyPackPublishBody>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task DemoteCatalogEntry_blocks_mutation_when_latest_committed_run_has_unusable_manifest()
    {
        Mock<IPolicyPackHttpFacade> httpFacade = new();
        httpFacade
            .Setup(f => f.DemoteCatalogEntryAsync(
                It.IsAny<PolicyPackDemoteCatalogBody>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(PolicyPackHttpResult<bool>.Success(true));

        PolicyPacksController sut = CreateControllerWithUnusableCommittedRun(httpFacade);

        IActionResult result = await sut.DemoteCatalogEntry(
            new DemotePolicyPackCatalogEntryRequest
            {
                PolicyPackCatalogEntryId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        httpFacade.Verify(
            facade => facade.DemoteCatalogEntryAsync(
                It.IsAny<PolicyPackDemoteCatalogBody>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static PolicyPacksController CreateControllerWithUnusableCommittedRun(
        Mock<IPolicyPackHttpFacade> httpFacade)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(CallerScope);

        Mock<IRunDetailQueryService> runDetails = new();
        runDetails
            .Setup(query => query.ListRunSummariesKeysetAsync(null, 50, It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                (IReadOnlyList<RunSummary>)[
                    new RunSummary
                    {
                        RunId = "not-a-guid",
                        Status = "Committed",
                    }
                ],
                false,
                (string?)null));

        return new PolicyPacksController(
            httpFacade.Object,
            new CreatePolicyPackRequestValidator(),
            new PublishPolicyPackVersionRequestValidator(),
            new AssignPolicyPackRequestValidator(),
            scopeProvider.Object,
            runDetails.Object,
            Mock.Of<IAuthorityQueryService>(),
            Mock.Of<IManifestHashService>())
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
