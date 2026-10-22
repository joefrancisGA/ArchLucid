using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Diagnostics;

[Collection("ArchLucidInstrumentation")]
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OrchestratorStateTransitionTelemetryTests
{
    [SkippableFact]
    public void RecordOrchestratorStateTransition_adds_activity_event_when_trace_active()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();

        using ActivityListener listener = new()
        {
            ShouldListenTo = static source => source.Name == ArchLucidMeterNames.AuthorityRunActivitySource,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
        };

        ActivitySource.AddActivityListener(listener);

        Guid runId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        Activity? started = ArchLucidInstrumentation.AuthorityRun.StartActivity("test.orchestrator");
        started.Should().NotBeNull();

        using Activity activity = started!;

        ArchLucidInstrumentation.RecordOrchestratorStateTransition(runId, "run_persisted", "inline_authority_pipeline_stages");

        activity.Events.Should().ContainSingle(e =>
            e.Name == "orchestrator.state_transition"
            && e.Tags.Any(t => t.Key == "from_state" && (string?)t.Value == "run_persisted")
            && e.Tags.Any(t => t.Key == "to_state" && (string?)t.Value == "inline_authority_pipeline_stages")
            && e.Tags.Any(t => t.Key == "archlucid.run_id" && (string?)t.Value == runId.ToString("D")));
    }
}
