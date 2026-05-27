using System.Diagnostics;

using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

using Polly.CircuitBreaker;
using Polly.Timeout;

namespace ArchLucid.AgentRuntime.Tests;

[Collection("ArchLucidInstrumentation")]
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentHandlerDegradationTelemetryTests
{
    [Fact]
    public void ResolveReasonCode_maps_timeout_and_circuit_exceptions()
    {
        AgentHandlerDegradationTelemetry.ResolveReasonCode(new TimeoutRejectedException())
            .Should().Be(AgentHandlerDegradationReasonCodes.HandlerTimeout);

        AgentHandlerDegradationTelemetry.ResolveReasonCode(new BrokenCircuitException("open"))
            .Should().Be(AgentHandlerDegradationReasonCodes.CircuitOpen);

        AgentHandlerDegradationTelemetry.ResolveReasonCode(new InvalidOperationException("other"))
            .Should().Be(AgentHandlerDegradationReasonCodes.ResilienceFailure);
    }

    [SkippableFact]
    public void Record_adds_activity_event_and_degradation_tags_without_prompt_content()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();

        using ActivityListener listener = new()
        {
            ShouldListenTo = static source => source.Name == ArchLucidMeterNames.AgentHandlerActivitySource,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
        };

        ActivitySource.AddActivityListener(listener);

        AgentTask task = new()
        {
            TaskId = "task-telemetry",
            RunId = "run-telemetry",
            AgentType = AgentType.Compliance,
        };

        Activity? started = ArchLucidInstrumentation.AgentHandler.StartActivity("archlucid.agent.handle");
        started.Should().NotBeNull();

        using Activity activity = started!;

        AgentHandlerDegradationTelemetry.Record(
            activity,
            "run-telemetry",
            task,
            AgentTypeKeys.Compliance,
            AgentHandlerDegradationReasonCodes.CircuitOpen);

        activity.GetTagItem("archlucid.agent.degraded").Should().Be(true);
        activity.GetTagItem("archlucid.agent.degradation_reason")
            .Should().Be(AgentHandlerDegradationReasonCodes.CircuitOpen);

        activity.Events.Should().ContainSingle(e =>
            e.Name == "agent.handler.degraded"
            && e.Tags.Any(t => t.Key == "archlucid.run_id" && (string?)t.Value == "run-telemetry")
            && e.Tags.Any(t => t.Key == "archlucid.agent.degradation_reason"
                               && (string?)t.Value == AgentHandlerDegradationReasonCodes.CircuitOpen)
            && !e.Tags.Any(t => t.Key.Contains("prompt", StringComparison.OrdinalIgnoreCase)));
    }
}
