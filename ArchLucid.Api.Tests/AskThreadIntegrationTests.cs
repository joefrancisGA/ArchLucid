using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Core.Ask;
using ArchLucid.Core.Conversation;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     End-to-end: seed authority run â†’ POST <c>v1/ask</c> with fake LLM â†’ verify response includes thread and answer â†’
///     list conversations via <c>GET v1/conversations</c>.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class AskThreadIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private static HttpClient CreateScopedClient(AlertLifecycleWebAppFactory factory)
    {
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        return client;
    }

    [SkippableFact]
    public async Task Ask_with_seeded_run_returns_answer_and_creates_thread()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);

        HttpClient client = CreateScopedClient(factory);

        HttpResponseMessage askResponse = await client.PostAsJsonAsync(
            "v1/ask",
            new AskRequest { RunId = runId, Question = "What is the primary architecture topology?" },
            JsonOptions,
            CancellationToken.None);

        askResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        AskResponse? result = await askResponse.Content
            .ReadFromJsonAsync<AskResponse>(JsonOptions, CancellationToken.None);

        result.Should().NotBeNull();
        result.ThreadId.Should().NotBeEmpty();
        result.Answer.Should().NotBeNullOrWhiteSpace();

        HttpResponseMessage threadsResponse = await client.GetAsync(
            new Uri("v1/conversations?take=10", UriKind.Relative),
            CancellationToken.None);

        threadsResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        List<ConversationThread>? threads = await threadsResponse.Content
            .ReadFromJsonAsync<List<ConversationThread>>(JsonOptions, CancellationToken.None);

        threads.Should().NotBeNull();
        threads.Should().Contain(t => t.ThreadId == result.ThreadId);
    }

    [SkippableFact]
    public async Task Ask_follow_up_continues_same_thread()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);

        HttpClient client = CreateScopedClient(factory);

        HttpResponseMessage firstResponse = await client.PostAsJsonAsync(
            "v1/ask",
            new AskRequest { RunId = runId, Question = "How many decisions exist?" },
            JsonOptions,
            CancellationToken.None);

        firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        AskResponse? first = await firstResponse.Content
            .ReadFromJsonAsync<AskResponse>(JsonOptions, CancellationToken.None);

        first.Should().NotBeNull();
        Guid threadId = first.ThreadId;

        HttpResponseMessage followUpResponse = await client.PostAsJsonAsync(
            "v1/ask",
            new AskRequest { ThreadId = threadId, Question = "What are the security concerns?" },
            JsonOptions,
            CancellationToken.None);

        followUpResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        AskResponse? followUp = await followUpResponse.Content
            .ReadFromJsonAsync<AskResponse>(JsonOptions, CancellationToken.None);

        followUp.Should().NotBeNull();
        followUp.ThreadId.Should().Be(threadId, "follow-up should reuse the same thread");

        HttpResponseMessage messagesResponse = await client.GetAsync(
            new Uri($"v1/conversations/{threadId:D}/messages?take=50", UriKind.Relative),
            CancellationToken.None);

        messagesResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        List<ConversationMessage>? messages = await messagesResponse.Content
            .ReadFromJsonAsync<List<ConversationMessage>>(JsonOptions, CancellationToken.None);

        messages.Should().NotBeNull();
        messages.Should().HaveCountGreaterThanOrEqualTo(4, "two user + two assistant messages expected");
    }

    [SkippableFact]
    public async Task Ask_without_question_returns_bad_request()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        HttpClient client = CreateScopedClient(factory);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "v1/ask",
            new AskRequest { RunId = Guid.NewGuid(), Question = "" },
            JsonOptions,
            CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Ask_without_runId_or_threadId_returns_bad_request()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        HttpClient client = CreateScopedClient(factory);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "v1/ask",
            new AskRequest { Question = "Some question without anchor" },
            JsonOptions,
            CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Ask_stream_with_seeded_run_emits_token_and_done_events()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(
            factory.Services, CancellationToken.None);

        HttpClient client = CreateScopedClient(factory);

        using HttpRequestMessage request = new(HttpMethod.Post, "v1/ask/stream")
        {
            Content = JsonContent.Create(
                new AskRequest { RunId = runId, Question = "Summarize the primary topology risks." },
                options: JsonOptions)
        };
        request.Headers.Accept.ParseAdd("text/event-stream");

        using HttpResponseMessage response = await client.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/event-stream");

        await using Stream body = await response.Content.ReadAsStreamAsync(CancellationToken.None);
        using StreamReader reader = new(body);

        bool sawToken = false;
        AskResponse? donePayload = null;
        string? pendingEvent = null;

        while (await reader.ReadLineAsync(CancellationToken.None) is { } line)
        {
            if (line.StartsWith("event:", StringComparison.Ordinal))
            {
                pendingEvent = line["event:".Length..].Trim();
                continue;
            }

            if (!line.StartsWith("data:", StringComparison.Ordinal))
                continue;

            string data = line["data:".Length..].TrimStart();

            if (pendingEvent == "token")
                sawToken = true;

            if (pendingEvent == "done")
                donePayload = JsonSerializer.Deserialize<AskResponse>(data, JsonOptions);

            pendingEvent = null;
        }

        sawToken.Should().BeTrue("stream should emit at least one token event");
        donePayload.Should().NotBeNull("stream should terminate with a done payload");
        donePayload!.ThreadId.Should().NotBeEmpty();
        donePayload.Answer.Should().NotBeNullOrWhiteSpace();
    }
}
