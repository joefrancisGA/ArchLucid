using System.Text.Json;

using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingPayloadLlmRemediationCompletionTests
{
    [Fact]
    public async Task GenerateFinding_WithInvalidSchemaThenValidSchema_RecoversAndReturnsFinding()
    {
        const string invalidPayload = "42";
        const string validPayload =
            """{"requirementName":"Recovered","requirementText":"After remediation","isMandatory":true}""";

        Queue<string> responses = new([invalidPayload, validPayload]);
        StubFindingPayloadJsonCompletionClient client = new(responses);
        FindingPayloadValidator validator = new();
        IOptionsMonitor<FindingPayloadRemediationOptions> options =
            FindingPayloadRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 3);

        Finding envelope = BuildRequirementEnvelope();

        Finding result = await FindingPayloadLlmRemediationCompletion.CompleteAsync(
            client,
            validator,
            options,
            envelope,
            "system",
            "user",
            CancellationToken.None);

        RequirementFindingPayload? payload = FindingPayloadConverter.ToRequirementPayload(result);
        payload.Should().NotBeNull();
        payload!.RequirementName.Should().Be("Recovered");
        client.Calls.Should().HaveCount(2);
        client.Calls[1].UserPrompt.Should().Contain("Previous output failed validation");
        client.Calls[1].UserPrompt.Should().Contain("cannot be deserialized");
        result.Trace.Notes.Should().Contain(n => n.Contains("schema remediation", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GenerateFinding_WithConsistentlyInvalidSchema_ExhaustsRetriesAndDropsFinding()
    {
        const string invalidPayload = "42";

        StubFindingPayloadJsonCompletionClient client = new(new Queue<string>([invalidPayload, invalidPayload]));
        FindingPayloadValidator validator = new();
        IOptionsMonitor<FindingPayloadRemediationOptions> options =
            FindingPayloadRemediationOptionsMonitorTestFactory.Create(maxCompletionAttempts: 2);

        Finding envelope = BuildRequirementEnvelope();

        Func<Task> act = () => FindingPayloadLlmRemediationCompletion.CompleteAsync(
            client,
            validator,
            options,
            envelope,
            "system",
            "user",
            CancellationToken.None);

        InvalidOperationException ex = (await act.Should().ThrowAsync<InvalidOperationException>()).Which;
        ex.Message.Should().Contain("after 2 attempts");
        ex.Message.Should().Contain(envelope.FindingId);
        client.Calls.Should().HaveCount(2);
        client.Calls[1].UserPrompt.Should().Contain("cannot be deserialized");
    }

    private static Finding BuildRequirementEnvelope()
    {
        return new Finding
        {
            FindingId = "finding-remediation-test",
            FindingType = FindingTypes.RequirementFinding,
            Category = "Requirement",
            EngineType = "llm-test",
            Severity = FindingSeverity.Warning,
            Title = "Requirement gap",
            Rationale = "Test",
            PayloadType = nameof(RequirementFindingPayload),
        };
    }

    private sealed class StubFindingPayloadJsonCompletionClient(Queue<string> responses)
        : IFindingPayloadJsonCompletionClient
    {
        private readonly Queue<string> _responses = responses;

        public List<(string SystemPrompt, string UserPrompt)> Calls { get; } = [];

        public Task<string> CompleteJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken)
        {
            Calls.Add((systemPrompt, userPrompt));

            if (_responses.Count == 0)
                throw new InvalidOperationException("No stubbed LLM responses remain.");

            return Task.FromResult(_responses.Dequeue());
        }
    }
}

internal static class FindingPayloadRemediationOptionsMonitorTestFactory
{
    public static IOptionsMonitor<FindingPayloadRemediationOptions> Create(int maxCompletionAttempts)
    {
        FindingPayloadRemediationOptions options = new() { MaxCompletionAttempts = maxCompletionAttempts };
        options.Normalize();
        return new StubOptionsMonitor(options);
    }

    private sealed class StubOptionsMonitor(FindingPayloadRemediationOptions current) : IOptionsMonitor<FindingPayloadRemediationOptions>
    {
        public FindingPayloadRemediationOptions CurrentValue { get; } = current;

        public FindingPayloadRemediationOptions Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable OnChange(Action<FindingPayloadRemediationOptions, string?> listener)
        {
            return NullDisposable.Instance;
        }

        private sealed class NullDisposable : IDisposable
        {
            public static readonly NullDisposable Instance = new();

            public void Dispose()
            {
            }
        }
    }
}
