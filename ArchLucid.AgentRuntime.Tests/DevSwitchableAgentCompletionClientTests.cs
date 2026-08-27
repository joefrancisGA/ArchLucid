using ArchLucid.Core.DevTesting;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DevSwitchableAgentCompletionClientTests
{
    [Fact]
    public async Task CompleteJsonAsync_when_simulator_mode_uses_offline_client()
    {
        Mock<IEffectiveAgentExecutionModeAccessor> accessor = new();
        accessor.Setup(static a => a.GetEffectiveMode()).Returns(DevAgentExecutionModeHeaderNames.Simulator);

        FakeAgentCompletionClient simulator = new(static (_, _) => """{"answer":"offline"}""");
        FakeAgentCompletionClient real = new(static (_, _) => """{"answer":"live"}""");

        DevSwitchableAgentCompletionClient client = new(
            accessor.Object,
            simulator,
            real,
            NullLogger<DevSwitchableAgentCompletionClient>.Instance);

        string json = await client.CompleteJsonAsync("system", "user");

        json.Should().Be("""{"answer":"offline"}""");
    }

    [Fact]
    public async Task CompleteJsonAsync_when_real_mode_uses_live_client()
    {
        Mock<IEffectiveAgentExecutionModeAccessor> accessor = new();
        accessor.Setup(static a => a.GetEffectiveMode()).Returns(DevAgentExecutionModeHeaderNames.Real);

        FakeAgentCompletionClient simulator = new(static (_, _) => """{"answer":"offline"}""");
        FakeAgentCompletionClient real = new(static (_, _) => """{"answer":"live"}""");

        DevSwitchableAgentCompletionClient client = new(
            accessor.Object,
            simulator,
            real,
            NullLogger<DevSwitchableAgentCompletionClient>.Instance);

        string json = await client.CompleteJsonAsync("system", "user");

        json.Should().Be("""{"answer":"live"}""");
    }

    [Fact]
    public async Task CompleteJsonAsync_when_real_mode_without_live_client_throws()
    {
        Mock<IEffectiveAgentExecutionModeAccessor> accessor = new();
        accessor.Setup(static a => a.GetEffectiveMode()).Returns(DevAgentExecutionModeHeaderNames.Real);

        FakeAgentCompletionClient simulator = new(static (_, _) => """{"answer":"offline"}""");

        DevSwitchableAgentCompletionClient client = new(
            accessor.Object,
            simulator,
            realCompletionClient: null,
            NullLogger<DevSwitchableAgentCompletionClient>.Instance);

        Func<Task> act = () => client.CompleteJsonAsync("system", "user");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Azure OpenAI*");
    }
}
