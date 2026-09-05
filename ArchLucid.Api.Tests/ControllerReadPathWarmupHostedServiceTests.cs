using System.Net;

using ArchLucid.Api.Hosting;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
public sealed class ControllerReadPathWarmupHostedServiceTests
{
    [SkippableTheory]
    [InlineData("/v1/learning/plans?maxPlans=1", HttpStatusCode.OK, true)]
    [InlineData("/v1/learning/plans?maxPlans=1", HttpStatusCode.NotFound, false)]
    [InlineData("/v1/architecture/draft/00000000-0000-0000-0000-000000000001", HttpStatusCode.NotFound, true)]
    [InlineData("/v1/architecture/draft/00000000-0000-0000-0000-000000000001", HttpStatusCode.OK, true)]
    [InlineData("/v1/architecture/draft/00000000-0000-0000-0000-000000000001", HttpStatusCode.InternalServerError, false)]
    [InlineData("/v1/architecture/draft?mine=true&page=1&pageSize=1", HttpStatusCode.OK, true)]
    [InlineData("/v1/architecture/draft?mine=true&page=1&pageSize=1", HttpStatusCode.Unauthorized, true)]
    [InlineData("/v1/architecture/draft?mine=true&page=1&pageSize=1", HttpStatusCode.InternalServerError, false)]
    public void IsExpectedWarmupStatus_matches_planned_read_paths(
        string relativePath,
        HttpStatusCode statusCode,
        bool expected)
    {
        ControllerReadPathWarmupHostedService.IsExpectedWarmupStatus(relativePath, statusCode)
            .Should()
            .Be(expected);
    }

    [SkippableFact]
    public void WarmupRelativePaths_includes_learning_plans_and_draft_read()
    {
        ControllerReadPathWarmupHostedService.WarmupRelativePaths.Should().Contain("/v1/learning/plans?maxPlans=1");
        ControllerReadPathWarmupHostedService.WarmupRelativePaths.Should()
            .Contain("/v1/architecture/draft?mine=true&page=1&pageSize=1");
        ControllerReadPathWarmupHostedService.WarmupRelativePaths.Should()
            .Contain("/v1/architecture/draft/00000000-0000-0000-0000-000000000001");
    }
}
