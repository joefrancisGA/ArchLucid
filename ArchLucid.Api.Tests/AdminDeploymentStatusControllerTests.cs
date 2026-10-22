using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminDeploymentStatusControllerTests
{
    [Fact]
    public async Task GetDeploymentStatus_returns_ok_and_audits_view()
    {
        AdminDeploymentStatusResponse expected = new()
        {
            Environment = "Development",
            ReleaseBuildId = "sha1",
            ApiBuildId = "sha1",
            FrontendBuildId = "sha1",
            WorkerBuildId = "Unknown",
            ComponentAgreement = AdminDeploymentStatusValues.AgreementPartial,
            OverallStatus = AdminDeploymentStatusValues.OverallWarning,
        };

        Mock<IAdminDeploymentStatusQuery> query = new();
        query
            .Setup(q => q.GetAsync("sha1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        Mock<IAuditService> audit = new();
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        AdminDeploymentStatusController sut = new(query.Object, audit.Object, scope.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        ActionResult<AdminDeploymentStatusResponse> result =
            await sut.GetDeploymentStatusAsync("sha1", CancellationToken.None);

        OkObjectResult ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(expected);

        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.AdminDeploymentStatusViewed),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
