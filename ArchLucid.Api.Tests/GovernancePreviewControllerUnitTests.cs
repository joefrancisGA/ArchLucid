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
    public async Task Preview_returns_bad_request_when_run_id_is_empty_guid()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Empty.ToString("D"),
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_run_id_is_null()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = null!,
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_run_id_is_whitespace()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = "   ",
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_run_id_exceeds_max_length()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = new string('a', 65),
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = new string('a', 129),
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_accepts_padded_manifest_version_when_untrimmed_length_exceeds_max()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedManifestVersion = $"{new string(' ', 125)}v1";

        Mock<IGovernancePreviewService> preview = new();
        preview
            .Setup(p => p.PreviewActivationAsync(It.IsAny<GovernancePreviewRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernancePreviewResult());

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = runId.ToString("D"),
                ManifestVersion = paddedManifestVersion,
                Environment = "dev",
            },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Preview_accepts_padded_run_id_when_untrimmed_length_exceeds_max()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string paddedRunId = $"{new string(' ', 30)}{runId:D}{new string(' ', 30)}";

        Mock<IGovernancePreviewService> preview = new();
        preview
            .Setup(p => p.PreviewActivationAsync(It.IsAny<GovernancePreviewRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GovernancePreviewResult());

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = paddedRunId,
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_environment_is_invalid()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "v1",
                Environment = "staging",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_environment_is_whitespace()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "v1",
                Environment = "   ",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
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

    [Fact]
    public async Task CompareEnvironments_returns_bad_request_when_source_environment_is_invalid()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "staging",
                TargetEnvironment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_bad_request_when_source_environment_is_whitespace()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "   ",
                TargetEnvironment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_bad_request_when_environments_are_the_same()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "dev",
                TargetEnvironment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_not_found_when_workspace_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

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
                    WorkspaceId = foreignWorkspaceId,
                    TenantId = Scope.TenantId,
                    Name = "foreign",
                    DefaultProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                }
            ]);

        GovernancePreviewController controller = new(
            preview.Object,
            scopeProvider.Object,
            tenants.Object,
            NullLogger<GovernancePreviewController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

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
    public async Task CompareEnvironments_returns_not_found_when_workspace_is_out_of_scope()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

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
                    WorkspaceId = foreignWorkspaceId,
                    TenantId = Scope.TenantId,
                    Name = "foreign",
                    DefaultProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.GetUtcNow(),
                }
            ]);

        GovernancePreviewController controller = new(
            preview.Object,
            scopeProvider.Object,
            tenants.Object,
            NullLogger<GovernancePreviewController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

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

    private static GovernancePreviewController CreateController(IGovernancePreviewService previewService, bool tenantExists)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

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
                        TenantId = Scope.TenantId,
                        Name = "workspace",
                        DefaultProjectId = Scope.ProjectId,
                        CreatedUtc = TimeProvider.System.GetUtcNow(),
                    }
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
