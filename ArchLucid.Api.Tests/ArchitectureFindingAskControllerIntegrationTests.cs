using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Core.Ask;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ArchitectureFindingAskControllerIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    [SkippableFact]
    public Task AskAboutFinding_returns_bad_request_when_question_missing()
    {
        return IntegrationTestDeadline.RunAsync(
            nameof(AskAboutFinding_returns_bad_request_when_question_missing),
            async testDeadline =>
            {
                await using AlertLifecycleWebAppFactory factory = new();
                HttpClient client = await AlertLifecycleIntegrationHost.EnsureClientAsync(factory);
                Guid findingId = Guid.NewGuid();
                using CancellationTokenSource requestTimeout =
                    IntegrationTestDeadline.CreateLinkedRequestTimeoutSource(testDeadline);

                HttpResponseMessage response = await client.PostAsJsonAsync(
                    $"v1/architecture/finding/{findingId:D}/ask",
                    new FindingAskRequest { Question = "   " },
                    JsonOptions,
                    requestTimeout.Token);

                response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            });
    }
}
