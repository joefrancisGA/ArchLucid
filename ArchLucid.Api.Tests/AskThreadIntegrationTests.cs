using System.Net;

using System.Net.Http.Json;

using System.Text.Json;



using ArchLucid.Core.Ask;

using ArchLucid.Core.Conversation;



using FluentAssertions;



namespace ArchLucid.Api.Tests;



/// <summary>

///     End-to-end: seed authority run → POST <c>v1/ask</c> with fake LLM → verify response includes thread and answer →

///     list conversations via <c>GET v1/conversations</c>.

/// </summary>

// CI #2268 / #2378: per-test factory so a wedged shared host cannot poison the class (IntegrationTestDeadline abandons

// the body at 150s while the HTTP call keeps running). Cold-boot cost is acceptable on the warn-only InMemory slow slice.

[Trait("Category", "Slow")]

[Trait("Suite", "Core")]

[Collection("ArchLucidEnvMutation")]

public sealed class AskThreadIntegrationTests

{

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)

    {

        PropertyNameCaseInsensitive = true

    };



    private static async Task<HttpClient> CreateScopedClientAsync(AlertLifecycleWebAppFactory factory)

    {

        HttpClient client = await AlertLifecycleIntegrationHost.EnsureClientAsync(factory);

        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);



        return client;

    }



    [SkippableFact]

    public Task Ask_with_seeded_run_returns_answer_and_creates_thread()

    {

        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();



        return IntegrationTestDeadline.RunAsync(

            nameof(Ask_with_seeded_run_returns_answer_and_creates_thread),

            async testDeadline =>

            {

                await using AlertLifecycleWebAppFactory factory = new();

                using CancellationTokenSource requestTimeout =

                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);



                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);



                Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(

                    services,

                    requestTimeout.Token);



                HttpClient client = await CreateScopedClientAsync(factory);



                HttpResponseMessage askResponse = await client.PostAsJsonAsync(

                    "v1/ask",

                    new AskRequest { RunId = runId, Question = "What is the primary architecture topology?" },

                    JsonOptions,

                    requestTimeout.Token);



                askResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                AskResponse? result = await askResponse.Content

                    .ReadFromJsonAsync<AskResponse>(JsonOptions, requestTimeout.Token);



                result.Should().NotBeNull();

                result.ThreadId.Should().NotBeEmpty();

                result.Answer.Should().NotBeNullOrWhiteSpace();



                HttpResponseMessage threadsResponse = await client.GetAsync(

                    new Uri("v1/conversations?take=10", UriKind.Relative),

                    requestTimeout.Token);



                threadsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                List<ConversationThread>? threads = await threadsResponse.Content

                    .ReadFromJsonAsync<List<ConversationThread>>(JsonOptions, requestTimeout.Token);



                threads.Should().NotBeNull();

                threads.Should().Contain(t => t.ThreadId == result.ThreadId);

            },

            IntegrationTestDeadline.DefaultTestTimeout);

    }



    [SkippableFact]

    public Task Ask_follow_up_continues_same_thread()

    {

        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();



        return IntegrationTestDeadline.RunAsync(

            nameof(Ask_follow_up_continues_same_thread),

            async testDeadline =>

            {

                await using AlertLifecycleWebAppFactory factory = new();

                using CancellationTokenSource requestTimeout =

                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);



                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);



                Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(

                    services,

                    requestTimeout.Token);



                HttpClient client = await CreateScopedClientAsync(factory);



                HttpResponseMessage firstResponse = await client.PostAsJsonAsync(

                    "v1/ask",

                    new AskRequest { RunId = runId, Question = "How many decisions exist?" },

                    JsonOptions,

                    requestTimeout.Token);



                firstResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                AskResponse? first = await firstResponse.Content

                    .ReadFromJsonAsync<AskResponse>(JsonOptions, requestTimeout.Token);



                first.Should().NotBeNull();

                Guid threadId = first.ThreadId;



                HttpResponseMessage followUpResponse = await client.PostAsJsonAsync(

                    "v1/ask",

                    new AskRequest { ThreadId = threadId, Question = "What are the security concerns?" },

                    JsonOptions,

                    requestTimeout.Token);



                followUpResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                AskResponse? followUp = await followUpResponse.Content

                    .ReadFromJsonAsync<AskResponse>(JsonOptions, requestTimeout.Token);



                followUp.Should().NotBeNull();

                followUp.ThreadId.Should().Be(threadId, "follow-up should reuse the same thread");



                HttpResponseMessage messagesResponse = await client.GetAsync(

                    new Uri($"v1/conversations/{threadId:D}/messages?take=50", UriKind.Relative),

                    requestTimeout.Token);



                messagesResponse.StatusCode.Should().Be(HttpStatusCode.OK);

                List<ConversationMessage>? messages = await messagesResponse.Content

                    .ReadFromJsonAsync<List<ConversationMessage>>(JsonOptions, requestTimeout.Token);



                messages.Should().NotBeNull();

                messages.Should().HaveCountGreaterThanOrEqualTo(4, "two user + two assistant messages expected");

            },

            IntegrationTestDeadline.DefaultTestTimeout);

    }



    [SkippableFact]

    public Task Ask_without_question_returns_bad_request()

    {

        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();



        return IntegrationTestDeadline.RunAsync(

            nameof(Ask_without_question_returns_bad_request),

            async testDeadline =>

            {

                await using AlertLifecycleWebAppFactory factory = new();

                HttpClient client = await CreateScopedClientAsync(factory);

                using CancellationTokenSource requestTimeout =

                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);



                HttpResponseMessage response = await client.PostAsJsonAsync(

                    "v1/ask",

                    new AskRequest { RunId = Guid.NewGuid(), Question = "" },

                    JsonOptions,

                    requestTimeout.Token);



                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

            },

            IntegrationTestDeadline.DefaultTestTimeout);

    }



    [SkippableFact]

    public Task Ask_without_runId_uses_workspace_scope_and_returns_answer()

    {

        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();



        return IntegrationTestDeadline.RunAsync(

            nameof(Ask_without_runId_uses_workspace_scope_and_returns_answer),

            async testDeadline =>

            {

                await using AlertLifecycleWebAppFactory factory = new();

                HttpClient client = await CreateScopedClientAsync(factory);

                using CancellationTokenSource requestTimeout =

                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);



                HttpResponseMessage response = await client.PostAsJsonAsync(

                    "v1/ask",

                    new AskRequest { Question = "What security patterns appear across our reviews?" },

                    JsonOptions,

                    requestTimeout.Token);



                response.StatusCode.Should().Be(HttpStatusCode.OK);

                AskResponse? result = await response.Content

                    .ReadFromJsonAsync<AskResponse>(JsonOptions, requestTimeout.Token);



                result.Should().NotBeNull();

                result!.ThreadId.Should().NotBeEmpty();

                result.Answer.Should().NotBeNullOrWhiteSpace();

            },

            IntegrationTestDeadline.DefaultTestTimeout);

    }



    [SkippableFact]

    public Task Ask_stream_with_seeded_run_emits_token_and_done_events()

    {

        InMemoryAskRetrievalIntegrationGate.SkipUnlessEnabled();



        return IntegrationTestDeadline.RunAsync(

            nameof(Ask_stream_with_seeded_run_emits_token_and_done_events),

            async testDeadline =>

            {

                await using AlertLifecycleWebAppFactory factory = new();

                using CancellationTokenSource requestTimeout =

                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);



                IServiceProvider services = await AlertLifecycleIntegrationHost.EnsureStartedAsync(factory);



                Guid runId = await AdvisoryIntegrationSeed.SeedDefaultScopeAuthorityRunAsync(

                    services,

                    requestTimeout.Token);



                HttpClient client = await CreateScopedClientAsync(factory);



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

                    requestTimeout.Token);



                response.StatusCode.Should().Be(HttpStatusCode.OK);

                response.Content.Headers.ContentType?.MediaType.Should().Be("text/event-stream");



                await using Stream body = await response.Content.ReadAsStreamAsync(requestTimeout.Token);

                using StreamReader reader = new(body);



                bool sawToken = false;

                AskResponse? donePayload = null;

                string? pendingEvent = null;



                while (await reader.ReadLineAsync(requestTimeout.Token) is { } line)

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

                    {

                        donePayload = JsonSerializer.Deserialize<AskResponse>(data, JsonOptions);

                        break;

                    }



                    pendingEvent = null;

                }



                sawToken.Should().BeTrue("stream should emit at least one token event");

                donePayload.Should().NotBeNull("stream should terminate with a done payload");

                donePayload!.ThreadId.Should().NotBeEmpty();

                donePayload.Answer.Should().NotBeNullOrWhiteSpace();

            },

            IntegrationTestDeadline.DefaultTestTimeout);

    }

}


