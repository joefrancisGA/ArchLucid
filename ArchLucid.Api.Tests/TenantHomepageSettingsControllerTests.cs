using System.Text.Json;

using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Serialization;
using ArchLucid.Application;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantHomepageSettingsControllerTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task GetAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            workspaceId: foreignWorkspaceId);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ListEligibleSamplesAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            workspaceId: foreignWorkspaceId);

        IActionResult action = await controller.ListEligibleSamplesAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAsync_returns_not_found_when_workspace_missing()
    {
        Guid foreignWorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            workspaceId: foreignWorkspaceId);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest { SelectedRunId = null },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetAsync_returns_not_found_when_tenant_missing()
    {
        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            tenantExists: false);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetAsync_projects_snapshot_response()
    {
        Mock<IFeaturedCompletedSampleService> service = new();
        service
            .Setup(s => s.GetSnapshotAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FeaturedCompletedSampleSnapshot
            {
                SelectedRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                IsConfigured = true,
                IsAvailable = true,
                ReviewTitle = "Claims intake modernization",
                ArchitectureName = "Claims intake modernization",
                CompletedUtc = DateTimeOffset.Parse("2026-01-01T00:00:00Z"),
                IsSampleApproved = true,
            });

        TenantHomepageSettingsController controller = CreateController(service.Object);

        IActionResult action = await controller.GetAsync(CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        TenantHomepageSettingsGetResponse body = ok.Value.Should().BeOfType<TenantHomepageSettingsGetResponse>().Subject;

        body.IsConfigured.Should().BeTrue();
        body.IsAvailable.Should().BeTrue();
        body.ReviewTitle.Should().Be("Claims intake modernization");
    }

    [Fact]
    public async Task PutAsync_clears_selection_when_selected_run_id_is_explicitly_null()
    {
        Mock<IFeaturedCompletedSampleService> service = new();
        service
            .Setup(s => s.ClearSelectionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FeaturedCompletedSampleSnapshot
            {
                IsConfigured = false,
                IsAvailable = false,
            });

        TenantHomepageSettingsController controller = CreateController(service.Object);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest { SelectedRunId = null },
            CancellationToken.None);

        action.Should().BeOfType<OkObjectResult>();
        service.Verify(s => s.ClearSelectionAsync(It.IsAny<CancellationToken>()), Times.Once);
        service.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("{}", "missing selectedRunId is rejected during JSON deserialization")]
    public void PutRequest_deserialization_rejects_missing_selected_run_id(string payload, string because)
    {
        Action act = () => JsonSerializer.Deserialize<TenantHomepageSettingsPutRequest>(
            payload,
            ArchLucidApiJsonSerializerOptions.Web);

        act.Should().Throw<JsonException>(because);
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_selection_is_ineligible()
    {
        Mock<IFeaturedCompletedSampleService> service = new();
        service
            .Setup(s => s.SetSelectedRunIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("The selected review is not eligible for workspace sample use."));

        TenantHomepageSettingsController controller = CreateController(service.Object);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest
            {
                SelectedRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            },
            CancellationToken.None);

        action.Should().BeOfType<ObjectResult>();
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_selected_run_id_is_empty()
    {
        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(service.Object);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest
            {
                SelectedRunId = Guid.Empty,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAsync_returns_bad_request_when_selected_run_id_is_empty_and_tenant_missing()
    {
        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            tenantExists: false);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest
            {
                SelectedRunId = Guid.Empty,
            },
            CancellationToken.None);

        ObjectResult badRequest = action.Should().BeOfType<ObjectResult>().Subject;
        badRequest.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        service.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task PutAsync_returns_not_found_when_selected_run_is_out_of_scope()
    {
        Guid foreignRunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IFeaturedCompletedSampleService> service = new();
        service
            .Setup(s => s.SetSelectedRunIdAsync(foreignRunId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new RunNotFoundException(foreignRunId.ToString("D")));

        TenantHomepageSettingsController controller = CreateController(service.Object);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest
            {
                SelectedRunId = foreignRunId,
            },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task PutAsync_returns_not_found_when_tenant_missing()
    {
        Mock<IFeaturedCompletedSampleService> service = new(MockBehavior.Strict);

        TenantHomepageSettingsController controller = CreateController(
            service.Object,
            tenantExists: false);

        IActionResult action = await controller.PutAsync(
            new TenantHomepageSettingsPutRequest { SelectedRunId = null },
            CancellationToken.None);

        ObjectResult notFound = action.Should().BeOfType<ObjectResult>().Subject;
        notFound.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        service.VerifyNoOtherCalls();
    }

    private static TenantHomepageSettingsController CreateController(
        IFeaturedCompletedSampleService service,
        bool tenantExists = true,
        Guid? workspaceId = null)
    {
        Guid resolvedWorkspaceId = workspaceId ?? Scope.WorkspaceId;

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Scope.TenantId,
            WorkspaceId = resolvedWorkspaceId,
            ProjectId = Scope.ProjectId,
        });

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(r => r.GetByIdAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(tenantExists ? new TenantRecord { Id = Scope.TenantId, Name = "contoso" } : null);
        tenants
            .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    WorkspaceId = Scope.WorkspaceId,
                    Name = "primary",
                },
            ]);

        if (tenantExists)
        {
            tenants
                .Setup(r => r.ListWorkspacesAsync(Scope.TenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(
                [
                    new TenantWorkspaceListItem
                    {
                        WorkspaceId = Scope.WorkspaceId,
                        Name = "primary",
                    },
                ]);
        }

        TenantHomepageSettingsController controller = new(
            service,
            scopeProvider.Object,
            Mock.Of<IAuditService>(),
            tenants.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext(),
        };

        return controller;
    }
}
