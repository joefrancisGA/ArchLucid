using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;
using ArchLucid.TestSupport.SealedManifest;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class GovernancePreviewControllerMissingRunTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Preview_returns_not_found_for_missing_run_before_sealed_manifest_check()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);
        preview
            .Setup(service => service.PreviewActivationAsync(
                It.Is<GovernancePreviewRequest>(request => request.RunId == runId.ToString("D")),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(runId.ToString("D")));

        Mock<IAuthorityQueryService> authority = new();
        authority
            .Setup(query => query.GetRunDetailForManifestCompareAsync(
                Scope,
                runId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        GovernancePreviewController sut = CreateController(preview.Object, authority.Object);

        IActionResult result = await sut.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = "1.0.0",
                Environment = "prod",
            },
            CancellationToken.None);

        result.Should().BeOfType<ObjectResult>().Which.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyAll();
    }

    private static GovernancePreviewController CreateController(
        IGovernancePreviewService previewService,
        IAuthorityQueryService authorityQueryService)
    {
        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantRecord { Id = Scope.TenantId, Name = "contoso" });

        tenants
            .Setup(repository => repository.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        return new GovernancePreviewController(
            previewService,
            scopeMock.Object,
            tenants.Object,
            authorityQueryService,
            SealedManifestHashTestSupport.CreateManifestHashService(),
            SealedManifestHashTestSupport.CreateRunDetailQueryServiceWithoutCommittedRuns(),
            NullLogger<GovernancePreviewController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
