using ArchLucid.Api.Controllers.Governance;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Unit coverage for <c>GET /v1/governance/policy-pack-content-schema</c> HTTP wiring.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernanceControllerPolicyPackContentSchemaTests
{
    [SkippableFact]
    public void GetPolicyPackContentDocumentJsonSchema_ReturnsOkWithResponse()
    {
        PolicyPackContentDocumentJsonSchemaResponse expected = new()
        {
            Schema = default
        };

        Mock<IPolicyPackSchemaKeysService> schemaKeys = new();
        schemaKeys.Setup(service => service.GetContentDocumentJsonSchema()).Returns(expected);

        GovernanceController sut = CreateController(schemaKeys.Object);

        IActionResult result = sut.GetPolicyPackContentDocumentJsonSchema();

        result.Should().BeOfType<OkObjectResult>();
        OkObjectResult ok = (OkObjectResult)result;
        ok.Value.Should().BeSameAs(expected);
    }

    private static GovernanceController CreateController(IPolicyPackSchemaKeysService schemaKeysService) =>
        new(
            Mock.Of<IGovernanceWorkflowService>(),
            Mock.Of<IGovernanceApprovalRequestRepository>(),
            Mock.Of<IGovernancePromotionRecordRepository>(),
            Mock.Of<IGovernanceEnvironmentActivationRepository>(),
            Mock.Of<IActorContext>(),
            Mock.Of<IScopeContextProvider>(),
            Mock.Of<IGovernanceDashboardService>(),
            Mock.Of<IGovernanceLineageService>(),
            Mock.Of<IGovernanceRationaleService>(),
            Mock.Of<IComplianceDriftTrendService>(),
            Mock.Of<IPolicyPackDryRunService>(),
            Mock.Of<IPolicyPackGovernanceDryRunService>(),
            schemaKeysService,
            Mock.Of<Core.Audit.IAuditService>(),
            Mock.Of<IPolicyPackDraftService>(),
            NullLogger<GovernanceController>.Instance);
}
