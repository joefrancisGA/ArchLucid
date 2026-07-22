using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Tests.Evaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch9Tests
{
    [Fact]
    public void AgentOutputTraceEvaluationHook_rejects_null_recorder()
    {
        Action act = () => _ = new AgentOutputTraceEvaluationHook(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task AgentOutputTraceEvaluationHook_rejects_whitespace_run_id()
    {
        AgentOutputTraceEvaluationHook sut = CreateHookWithEmptyTraces();

        Func<Task> act = () => sut.AfterSuccessfulExecuteAsync("  ", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task AgentOutputTraceEvaluationHook_forwards_to_recorder_for_empty_traces()
    {
        AgentOutputTraceEvaluationHook sut = CreateHookWithEmptyTraces();

        await sut.AfterSuccessfulExecuteAsync("run-coverage-9", CancellationToken.None);
    }

    [Fact]
    public void AgentCompletionTokenUsage_peek_and_consume_round_trip_seeded_values()
    {
        LlmCompletionTokenUsageAmbient.Clear();

        try
        {
            LlmCompletionTokenUsageAmbient.TestingSeed(11, 22, 3);

            AgentCompletionTokenUsage.TryPeek(out int? peekIn, out int? peekOut, out int? peekReasoning);
            peekIn.Should().Be(11);
            peekOut.Should().Be(22);
            peekReasoning.Should().Be(3);

            AgentCompletionTokenUsage.TryConsume(out int? consumeIn, out int? consumeOut, out int? consumeReasoning);
            consumeIn.Should().Be(11);
            consumeOut.Should().Be(22);
            consumeReasoning.Should().Be(3);

            AgentCompletionTokenUsage.TryPeek(out int? afterIn, out int? afterOut, out int? afterReasoning);
            afterIn.Should().BeNull();
            afterOut.Should().BeNull();
            afterReasoning.Should().BeNull();
        }
        finally
        {
            LlmCompletionTokenUsageAmbient.Clear();
        }
    }

    [Fact]
    public void AgentCompletionTokenUsage_unseeded_peek_returns_nulls()
    {
        LlmCompletionTokenUsageAmbient.Clear();

        try
        {
            AgentCompletionTokenUsage.TryPeek(out int? inputTokens, out int? outputTokens, out int? reasoningTokens);

            inputTokens.Should().BeNull();
            outputTokens.Should().BeNull();
            reasoningTokens.Should().BeNull();
        }
        finally
        {
            LlmCompletionTokenUsageAmbient.Clear();
        }
    }

    [Fact]
    public void LlmProviderDescriptor_for_openai_compatible_and_offline_unknown_map_provider_types()
    {
        Uri apiBase = new("http://localhost:11434/");
        LlmProviderDescriptor compatible = LlmProviderDescriptor.ForOpenAiCompatible(
            apiBase,
            " llama ",
            LlmProviderAuthScheme.None);

        compatible.ProviderKind.Should().Be("openai-compatible");
        compatible.ProviderType.Should().Be(LlmProviderType.LocalOllama);
        compatible.ModelId.Should().Be("llama");
        compatible.ApiBaseUri.Should().Be(apiBase);

        LlmProviderDescriptor offline = LlmProviderDescriptor.ForOffline("echo", "m");
        offline.ProviderType.Should().Be(LlmProviderType.Unknown);
        offline.ApiBaseUri.Should().BeNull();
        offline.AuthScheme.Should().Be(LlmProviderAuthScheme.None);
    }

    [Fact]
    public void LlmProviderDescriptor_for_openai_compatible_rejects_null_uri_and_whitespace_model()
    {
        Action nullUri = () =>
            _ = LlmProviderDescriptor.ForOpenAiCompatible(null!, "m", LlmProviderAuthScheme.None);
        Action blankModel = () =>
            _ = LlmProviderDescriptor.ForOpenAiCompatible(
                new Uri("http://localhost/"),
                "  ",
                LlmProviderAuthScheme.None);

        nullUri.Should().Throw<ArgumentNullException>();
        blankModel.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AgentResultSchemaViolationException_rejects_null_errors_and_whitespace_json()
    {
        Action nullErrors = () =>
            _ = new AgentResultSchemaViolationException("msg", null!, "{}", AgentType.Topology);
        Action blankJson = () =>
            _ = new AgentResultSchemaViolationException("msg", ["e"], "  ", AgentType.Topology);

        nullErrors.Should().Throw<ArgumentNullException>();
        blankJson.Should().Throw<ArgumentException>();
    }

    private static AgentOutputTraceEvaluationHook CreateHookWithEmptyTraces()
    {
        AgentOutputEvaluationRecorder recorder = AgentOutputEvaluationRecorderTests.CreateRecorder(
            new InMemoryAgentExecutionTraceRepository(),
            NullLogger<AgentOutputEvaluationRecorder>.Instance);

        return new AgentOutputTraceEvaluationHook(recorder);
    }
}
