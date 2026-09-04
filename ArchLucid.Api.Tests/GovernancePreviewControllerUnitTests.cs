using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Validators;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Contracts.Governance;
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
    public async Task Preview_returns_bad_request_when_manifest_version_exceeds_max_length()
    {
        string overlongManifestVersion = new string('v', GovernanceRequestValidationRules.ManifestVersionMaxLength + 1);
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = overlongManifestVersion,
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
        string overlongRunId = new string('r', GovernanceRequestValidationRules.RunIdMaxLength + 1);
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = overlongRunId,
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "v1",
                Environment = overlongEnvironment,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

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
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "missing-v",
                Environment = "dev"
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task Preview_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = foreignWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        GovernancePreviewController controller = CreateController(
            preview.Object,
            tenantExists: true,
            scopeProvider: scopeProvider.Object);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_not_found_when_tenant_missing()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: false);

        IActionResult action = await controller.Preview(
            new CreateGovernancePreviewRequest
            {
                RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd").ToString("D"),
                ManifestVersion = "v1",
                Environment = "dev",
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Preview_returns_bad_request_when_environment_is_unrecognized_and_tenant_missing()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: false);

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
    public async Task CompareEnvironments_returns_bad_request_when_source_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = overlongEnvironment,
                TargetEnvironment = "test",
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_bad_request_when_target_environment_exceeds_max_length()
    {
        string overlongEnvironment = new string('e', GovernanceEnvironmentSlug.MaxLength + 1);
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: true);

        IActionResult action = await controller.CompareEnvironments(
            new CreateGovernanceEnvironmentComparisonRequest
            {
                SourceEnvironment = "dev",
                TargetEnvironment = overlongEnvironment,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        preview.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CompareEnvironments_returns_validation_failed_when_source_equals_target()
    {
        Mock<IGovernancePreviewService> preview = new();
        preview
            .Setup(service => service.CompareEnvironmentsAsync(
                It.IsAny<GovernanceEnvironmentComparisonRequest>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException(
                "SourceEnvironment and TargetEnvironment must be different.",
                nameof(GovernanceEnvironmentComparisonRequest)));

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
        Microsoft.AspNetCore.Mvc.ProblemDetails problem =
            badRequest.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>().Subject;
        problem.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    [Fact]
    public async Task CompareEnvironments_returns_validation_failed_when_source_equals_target_and_tenant_missing()
    {
        Mock<IGovernancePreviewService> preview = new(MockBehavior.Strict);

        GovernancePreviewController controller = CreateController(preview.Object, tenantExists: false);

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
        IScopeContextProvider? scopeProvider = null)
    {
        Mock<IScopeContextProvider> scopeMock = new();
        scopeMock.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

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
            scopeProvider ?? scopeMock.Object,
            tenants.Object,
            NullLogger<GovernancePreviewController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
    }
}
