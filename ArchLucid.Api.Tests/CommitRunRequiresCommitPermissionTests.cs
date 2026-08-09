using System.Net;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Verifies <see cref="ArchLucid.Core.Authorization.ArchLucidPolicies.CanCommitRuns" /> when the
///     <c>commit:run</c> permission claim is absent (Operator role otherwise).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class CommitRunRequiresCommitPermissionTests(OperatorWithoutCommitRunPermissionApiFactory factory)
    : IClassFixture<OperatorWithoutCommitRunPermissionApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [SkippableFact]
    public async Task CommitRun_returns_403_when_commit_run_permission_claim_missing()
    {
        HttpResponseMessage response = await _client.PostAsync(
            $"/v1/architecture/review/{Guid.NewGuid():D}/finalize",
            null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
