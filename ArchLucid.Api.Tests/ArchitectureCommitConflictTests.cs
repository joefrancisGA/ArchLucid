using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Commit Conflict.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureCommitConflictTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CommitBeforeExecute_Returns409Conflict()
    {
        CreatedRunForTest created = await CreateRunForTestAsync();
        string runId = created.RunId;

        HttpResponseMessage commit = await Client.PostFinalizeForTestAsync(Factory, runId);

        commit.StatusCode.Should().Be(HttpStatusCode.Conflict);
        using JsonDocument doc = JsonDocument.Parse(await commit.Content.ReadAsStringAsync());
        doc.RootElement.GetProperty("title").GetString().Should().Be("Conflict");
        doc.RootElement.GetProperty("status").GetInt32().Should().Be(409);
    }
}
