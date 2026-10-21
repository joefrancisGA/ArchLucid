using System.Diagnostics.Metrics;

using ArchLucid.Api.Controllers.Alerts;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Core.Alerts.Simulation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport.Diagnostics;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

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

        Mock<ILogger<AlertSimulationController>> logger = new();
        logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        AlertSimulationController sut = CreateController(simulationService.Object, auditService.Object, logger.Object);

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

    [Fact]
    public async Task Simulate_logs_scope_context_and_records_audit_write_failure_metric_when_audit_abandoned()
    {
        using AuditWriteFailureMetricCapture capture = AuditWriteFailureMetricCapture.Start();

        RuleSimulationResult simulationResult = new()
        {
            RuleKind = "Simple",
            EvaluatedRunCount = 1,
            MatchedCount = 0,
            WouldCreateCount = 0,
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

        Mock<ILogger<AlertSimulationController>> logger = new();
        logger.Setup(l => l.IsEnabled(It.IsAny<LogLevel>())).Returns(true);

        AlertSimulationController sut = CreateController(simulationService.Object, auditService.Object, logger.Object);

        await sut.Simulate(
            new RuleSimulationRequest
            {
                RuleKind = "Simple",
                SimpleRule = new AlertRule { Name = "test-rule" },
            },
            CancellationToken.None);

        logger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>(
                    (state, _) => state.ToString()!.Contains(Scope.TenantId.ToString("D"), StringComparison.Ordinal)
                                  && state.ToString()!.Contains("Durable audit abandoned", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.Is<Func<It.IsAnyType, Exception?, string>>((_, _) => true)),
            Times.Once);

        capture.Measurements.Should().Contain(
            m => m.Name == "archlucid_audit_write_failures_total"
                 && m.Value == 1
                 && m.Tags.Any(t => t.Key == "event_type" && (string?)t.Value == AuditEventTypes.AlertRuleSimulationExecuted));
    }

    private static AlertSimulationController CreateController(
        IRuleSimulationService simulationService,
        IAuditService auditService,
        ILogger<AlertSimulationController> logger)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        return new AlertSimulationController(scopeProvider.Object, simulationService, auditService, logger);
    }

    private sealed class AuditWriteFailureMetricCapture : IDisposable
    {
        private readonly MeterListener _listener = new();
        private readonly List<LongMeasurement> _measurements = [];

        private AuditWriteFailureMetricCapture()
        {
            _listener.InstrumentPublished = (instrument, meterListener) =>
            {
                if (instrument.Meter.Name != ArchLucidInstrumentationTestSupport.MeterName)
                    return;

                meterListener.EnableMeasurementEvents(instrument);
            };

            _listener.SetMeasurementEventCallback<long>(
                (instrument, measurement, tags, _) =>
                {
                    _measurements.Add(
                        new LongMeasurement(instrument.Name, measurement, tags.ToArray()));
                });

            _listener.Start();
        }

        public IReadOnlyList<LongMeasurement> Measurements => _measurements;

        public void Dispose() => _listener.Dispose();

        public static AuditWriteFailureMetricCapture Start()
        {
            ArchLucidInstrumentationTestSupport.EnsureInitialized();
            return new AuditWriteFailureMetricCapture();
        }

        internal sealed record LongMeasurement(string Name, long Value, KeyValuePair<string, object?>[] Tags);
    }
}
