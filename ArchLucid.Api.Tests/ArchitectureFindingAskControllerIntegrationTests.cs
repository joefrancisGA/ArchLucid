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
    public async Task AskAboutFinding_returns_bad_request_when_question_missing()
    {
        await using AlertLifecycleWebAppFactory factory = new();
        HttpClient client = factory.CreateClient();
        Guid findingId = Guid.NewGuid();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"v1/architecture/finding/{findingId:D}/ask",
            new FindingAskRequest { Question = "   " },
            JsonOptions,
            CancellationToken.None);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
