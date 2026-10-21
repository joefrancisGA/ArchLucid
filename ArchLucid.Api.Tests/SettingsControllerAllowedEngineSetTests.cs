using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Admin;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Common;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration.Summary;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class SettingsControllerAllowedEngineSetTests
{
    [Fact]
    public async Task PutAllowedEngineSet_returns_bad_request_when_allowed_alias_ids_collection_is_null()
    {
        SettingsController controller = CreateController(Mock.Of<IWorkspaceAllowedEngineSetService>());

        WorkspaceAllowedEngineSetUpdateRequest request = new()
        {
            AllowedAliasIds = null!,
            DefaultAliasId = "balanced",
        };

        IActionResult result = await controller.PutAllowedEngineSet(request, CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        problem.Value.Should().BeOfType<Microsoft.AspNetCore.Mvc.ProblemDetails>()
            .Which.Type.Should().Be(ProblemTypes.ValidationFailed);
    }

    private static SettingsController CreateController(IWorkspaceAllowedEngineSetService engineSetService) =>
        new(
            Mock.Of<ITenantAgentOutputQualityGateModeService>(),
            Mock.Of<ITenantFindingEngineControlsService>(),
            Mock.Of<ITenantWorkOwnershipDeletePolicyService>(),
            Mock.Of<IWorkspaceModelExecutionProfileService>(),
            engineSetService,
            Mock.Of<IExternalSubprocessorEngineAcknowledgmentService>(),
            Mock.Of<IAgentModelAliasRegistry>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IAuditService>(),
            Mock.Of<IAuditRepository>(),
            TimeProvider.System)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
}
