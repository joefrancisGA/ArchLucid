using ArchLucid.Api.Controllers.Alerts;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Core.Alerts.Simulation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class AlertSimulationControllerSimulateTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task Simulate_returns_ok_when_simulation_succeeds_but_audit_log_throws()
    {
        RuleSimulationResult simulationResult = new()
        {
            RuleKind = "Simple",
            EvaluatedRunCount = 2,
            MatchedCount = 1,
            WouldCreateCount = 1,
            WouldSuppressCount = 0,
        };

        Mock<IRuleSimulationService> simulationService = new();
        simulationService
            .Setup(
                s => s.SimulateAsync(
                    Scope.TenantId,
                    Scope.WorkspaceId,
                    Scope.ProjectId,
                    It.IsAny<RuleSimulationRequest>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(simulationResult);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit store unavailable"));

        AlertSimulationController sut = CreateController(simulationService.Object, auditService.Object);

        IActionResult action = await sut.Simulate(
            new RuleSimulationRequest
            {
                RuleKind = "Simple",
                SimpleRule = new AlertRule { Name = "test-rule" },
            },
            CancellationToken.None);

        OkObjectResult ok = action.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeSameAs(simulationResult);
    }

    private static AlertSimulationController CreateController(
        IRuleSimulationService simulationService,
        IAuditService auditService)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new AlertSimulationController(scopeProvider.Object, simulationService, auditService);
    }
}
