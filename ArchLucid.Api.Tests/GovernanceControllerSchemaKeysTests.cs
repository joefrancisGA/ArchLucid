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
///     Unit coverage for <c>GET /v1/governance/schema-keys</c> HTTP wiring.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GovernanceControllerSchemaKeysTests
{
    [SkippableFact]
    public void GetPolicyPackSchemaKeys_ReturnsOkWithResponse()
    {
        PolicyPackSchemaKeysResponse expected = new()
        {
            Keys =
            [
                new PolicyPackSchemaKeyDescriptor
                {
                    Path = "complianceRuleIds",
                    JsonType = "array",
                    ValueType = "string",
                    ValueFormat = "uuid"
                }
            ],
            Tree =
            [
                new PolicyPackSchemaKeyNode
                {
                    Name = "complianceRuleIds",
                    JsonType = "array",
                    ValueType = "string",
                    ValueFormat = "uuid"
                }
            ]
        };

        Mock<IPolicyPackSchemaKeysService> schemaKeys = new();
        schemaKeys.Setup(service => service.GetSchemaKeys()).Returns(expected);

        GovernanceController sut = CreateController(schemaKeys.Object);

        IActionResult result = sut.GetPolicyPackSchemaKeys();

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
            NullLogger<GovernanceController>.Instance);
}
