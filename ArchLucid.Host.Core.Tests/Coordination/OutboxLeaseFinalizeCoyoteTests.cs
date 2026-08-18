using FluentAssertions;

using Microsoft.Coyote.SystematicTesting;

using CoyoteConfiguration = Microsoft.Coyote.Configuration;

namespace ArchLucid.Host.Core.Tests.Coordination;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OutboxLeaseFinalizeCoyoteTests
{
    [Fact]
    public void Coyote_outbox_finalize_exploration_passes_without_injected_bug()
    {
        OutboxLeaseFinalizeCoyoteBugGate.InjectDoubleFinalizeBug = false;
        CoyoteConfiguration config = CoyoteConfiguration.Create()
            .WithTestingIterations(20)
            .WithMaxSchedulingSteps(30);

        using TestingEngine engine = TestingEngine.Create(config, OutboxLeaseFinalizeCoyoteScenario.RunAsync);
        engine.Run();
        engine.TestReport.NumOfFoundBugs.Should().Be(0);
    }

    [Fact]
    public void Coyote_outbox_finalize_exploration_finds_injected_double_finalize_bug()
    {
        OutboxLeaseFinalizeCoyoteBugGate.InjectDoubleFinalizeBug = true;
        CoyoteConfiguration config = CoyoteConfiguration.Create()
            .WithTestingIterations(20)
            .WithMaxSchedulingSteps(30);

        using TestingEngine engine = TestingEngine.Create(config, OutboxLeaseFinalizeCoyoteScenario.RunAsync);
        engine.Run();
        engine.TestReport.NumOfFoundBugs.Should().BeGreaterThan(0);
        engine.TestReport.BugReports.Should().NotBeEmpty();
        engine.ReproducibleTrace.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Coyote_injected_bug_removed_passes_with_bounded_fair_scheduling_steps()
    {
        OutboxLeaseFinalizeCoyoteBugGate.InjectDoubleFinalizeBug = true;
        CoyoteConfiguration buggyConfig = CoyoteConfiguration.Create()
            .WithTestingIterations(10)
            .WithMaxSchedulingSteps(15, 150);

        using TestingEngine buggyEngine = TestingEngine.Create(buggyConfig, OutboxLeaseFinalizeCoyoteScenario.RunAsync);
        buggyEngine.Run();
        buggyEngine.TestReport.NumOfFoundBugs.Should().BeGreaterThan(0);

        OutboxLeaseFinalizeCoyoteBugGate.InjectDoubleFinalizeBug = false;
        CoyoteConfiguration fixedConfig = CoyoteConfiguration.Create()
            .WithTestingIterations(10)
            .WithMaxSchedulingSteps(15, 150);

        using TestingEngine fixedEngine = TestingEngine.Create(fixedConfig, OutboxLeaseFinalizeCoyoteScenario.RunAsync);
        fixedEngine.Run();
        fixedEngine.TestReport.NumOfFoundBugs.Should().Be(0);
    }
}
