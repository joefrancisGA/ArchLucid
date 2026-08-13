using ArchLucid.Api.OpenApi;

using FluentAssertions;

using Microsoft.OpenApi;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class OpenApiAudiencePathClassifierTests
{
    [Theory]
    [InlineData("v1/internal/diagnostics", false, OpenApiAudience.Internal)]
    [InlineData("v1/authority/runs/{runId}/tool-invocation-forensics", false, OpenApiAudience.Forensics)]
    [InlineData("v1/authority/runs/{runId}/traces/forensics", false, OpenApiAudience.Forensics)]
    [InlineData("v1/authority/runs/{runId}/buyer-summary", false, OpenApiAudience.Buyer)]
    [InlineData("v1/explain/{runId}", false, OpenApiAudience.Buyer)]
    [InlineData("v1/pilots/{pilotId}/deltas", false, OpenApiAudience.Buyer)]
    [InlineData("v1/roi/sponsor-report", false, OpenApiAudience.Buyer)]
    [InlineData("v1/authority/runs", false, OpenApiAudience.Operator)]
    [InlineData(null, false, OpenApiAudience.Operator)]
    public void Classify_maps_operator_routes(string? relativePath, bool allowsAnonymous, string expectedAudience)
    {
        OpenApiAudiencePathClassifier.Classify(relativePath, allowsAnonymous).Should().Be(expectedAudience);
    }

    [Theory]
    [InlineData("v1/marketing/trust-center", OpenApiAudience.Buyer)]
    [InlineData("v1/demo/review", OpenApiAudience.Buyer)]
    [InlineData("v1/registration", OpenApiAudience.Buyer)]
    [InlineData("v1/quickstart", OpenApiAudience.Buyer)]
    [InlineData("v1/auth/trial", OpenApiAudience.Buyer)]
    [InlineData("v1/version", OpenApiAudience.Buyer)]
    [InlineData("v1/agent-execution/cost-preview", OpenApiAudience.Buyer)]
    public void Classify_maps_anonymous_buyer_routes(string relativePath, string expectedAudience)
    {
        OpenApiAudiencePathClassifier.Classify(relativePath, allowsAnonymous: true).Should().Be(expectedAudience);
    }

    [Theory]
    [InlineData("v1/integrations/webhooks/jira", OpenApiAudience.Internal)]
    [InlineData("v1/integrations/slack/events", OpenApiAudience.Internal)]
    [InlineData("v1/admin/client-errors", OpenApiAudience.Internal)]
    [InlineData("v1/e2e/harness", OpenApiAudience.Internal)]
    [InlineData("v1/notifications/exec-digest/unsubscribe", OpenApiAudience.Internal)]
    public void Classify_maps_anonymous_internal_routes(string relativePath, string expectedAudience)
    {
        OpenApiAudiencePathClassifier.Classify(relativePath, allowsAnonymous: true).Should().Be(expectedAudience);
    }

    [Fact]
    public void Classify_anonymous_unclassified_route_defaults_to_operator()
    {
        OpenApiAudiencePathClassifier.Classify("v1/authority/projects", allowsAnonymous: true)
            .Should()
            .Be(OpenApiAudience.Operator);
    }

    [Fact]
    public void SetAudience_writes_extension_on_operation()
    {
        OpenApiOperation operation = new();

        OpenApiAudienceExtensionMutator.SetAudience(operation, OpenApiAudience.Buyer);

        operation.Extensions.Should().ContainKey(OpenApiAudience.ExtensionName);
        operation.Extensions![OpenApiAudience.ExtensionName].Should().NotBeNull();
    }
}
