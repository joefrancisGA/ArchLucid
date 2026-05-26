using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AdminQualityGateDiagnosticsControllerTests
{
    [SkippableFact]
    public void GetQualityGates_returns_effective_floors_from_options()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
            StructuralRejectBelow = 0.71,
            SemanticRejectBelow = 0.51,
            PilotStrictMinStructuralCompleteness = 0.91,
            PilotStrictMinSemanticScore = 0.55,
            PilotStrictMinEvidenceRefCount = 3,
            PilotStrictMinFaithfulnessSupportRatio = 0.62,
            PilotStrictMinAgentResultFaithfulnessSupportRatio = 0.58,
            EnforceOnReject = true,
            BlockRunOnReject = false,
        };

        Mock<IOptionsMonitor<AgentOutputQualityGateOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(options);

        AdminQualityGateDiagnosticsController sut = new(monitor.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        ActionResult<AdminQualityGateDiagnosticsResponse> result = sut.GetQualityGates();

        OkObjectResult ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        AdminQualityGateDiagnosticsResponse body =
            ok.Value.Should().BeOfType<AdminQualityGateDiagnosticsResponse>().Subject;

        body.Enabled.Should().BeTrue();
        body.Mode.Should().Be("PilotStrict");
        body.StructuralRejectBelow.Should().Be(0.71);
        body.SemanticRejectBelow.Should().Be(0.51);
        body.PilotStrictMinStructuralCompleteness.Should().Be(0.91);
        body.PilotStrictMinSemanticScore.Should().Be(0.55);
        body.PilotStrictMinEvidenceRefCount.Should().Be(3);
        body.PilotStrictMinFaithfulnessSupportRatio.Should().Be(0.62);
        body.PilotStrictMinAgentResultFaithfulnessSupportRatio.Should().Be(0.58);
        body.EnforceOnReject.Should().BeTrue();
        body.BlockRunOnReject.Should().BeFalse();
    }
}
