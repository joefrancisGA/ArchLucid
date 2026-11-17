using System.Net;
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

        await commit.AssertProblemForTestAsync(HttpStatusCode.Conflict, detailContains: "execute");
    }
}
