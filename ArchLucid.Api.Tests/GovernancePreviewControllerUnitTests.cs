using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Governance.Preview;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GovernancePreviewControllerUnitTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Preview_returns_not_found_when_manifest_version_missing()
    {
        Mock<IGovernancePreviewService> preview = new();
        preview
            .Setup(s => s.PreviewActivationAsync(It.IsAny<GovernancePreviewRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new GoldenManifestVersionNotFoundException("missing-v", "run-1"));

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = "run-1",
                ManifestVersion = "missing-v",
                Environment = "dev"
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Preview_returns_not_found_when_tenant_missing()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: false);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = "run-1",
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(
            preview.Object,
            tenantExists: true,
            workspaceId: foreignWorkspaceId);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = "run-1",
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(
            preview.Object,
            tenantExists: true,
            workspaceId: foreignWorkspaceId);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_not_found_when_tenant_missing()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: false);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "dev",
                TargetEnvironment = "test",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    private static GovernancePreviewController CreateController(
        IGovernancePreviewService previewService,
        bool tenantExists,
        Guid? workspaceId = null)
    {
        Guid effectiveWorkspaceId = workspaceId ?? Scope.WorkspaceId;

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = effectiveWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                tenantExists
                    ? new TenantRecord { Id = Scope.TenantId, Name = "contoso" }
                    : null);

        if (tenantExists)
        {
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
        }

        return new GovernancePreviewController(
            previewService,
            scopeProvider.Object,
            tenants.Object,
            NullLogger<GovernancePreviewController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
