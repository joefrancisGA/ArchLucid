using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

/// <summary>
///     Ensures C# publishers, recipe markdown, and Service Bus property resolvers stay aligned on payload field
///     names consumers rely on (correlation, deduplication, routing).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PublisherIntegrationPayloadAndRecipeDocumentationGuardTests
{
    [Fact]
    public void AuthorityRunCompleted_publisher_payload_property_names_match_expected_contract()
    {
        string root = TestRepositoryPaths.ResolveRepositoryRoot();
        string path = Path.Combine(root, "ArchLucid.Persistence.Runtime", "Orchestration", "AuthorityRunOrchestrator.cs");
        string source = File.ReadAllText(path);

        IReadOnlyList<string> names = CSharpAnonymousObjectInitializerPropertyExtractor.ExtractPropertyNames(
            "object integrationPayload = new",
            source);

        string[] expected =
        [
            "schemaVersion",
            "runId",
            "manifestId",
            "tenantId",
            "workspaceId",
            "projectId",
            "previousRunId",
            "findings"
        ];

        names.Should().Equal(expected);
    }

    [Fact]
    public void AlertFired_publisher_payload_property_names_match_expected_contract()
    {
        string root = TestRepositoryPaths.ResolveRepositoryRoot();
        string path = Path.Combine(root, "ArchLucid.Persistence.Alerts", "AlertIntegrationEventPublishing.cs");
        string text = File.ReadAllText(path);

        int firedStart = text.IndexOf("TryPublishFiredAsync", StringComparison.Ordinal);
        int resolvedStart = text.IndexOf("TryPublishResolvedAsync", StringComparison.Ordinal);
        firedStart.Should().BeGreaterThanOrEqualTo(0);
        resolvedStart.Should().BeGreaterThan(firedStart);

        string firedMethod = text.Substring(firedStart, resolvedStart - firedStart);

        IReadOnlyList<string> names = CSharpAnonymousObjectInitializerPropertyExtractor.ExtractPropertyNames(
            "object payload = new",
            firedMethod);

        string[] expected =
        [
            "schemaVersion",
            "tenantId",
            "workspaceId",
            "projectId",
            "alertId",
            "runId",
            "comparedToRunId",
            "ruleId",
            "category",
            "severity",
            "title",
            "deduplicationKey"
        ];

        names.Should().Equal(expected);
    }

    [Fact]
    public void ServiceBus_app_property_resolver_reads_alert_payload_keys_documented_for_operators()
    {
        // TryResolveAlertFired / TryResolveAlertResolved must keep using JSON keys that match publisher payloads
        // and docs (INTEGRATION_EVENTS_AND_WEBHOOKS.md, Power Automate recipes).
        string root = TestRepositoryPaths.ResolveRepositoryRoot();
        string path = Path.Combine(root, "ArchLucid.Core", "Integration", "IntegrationEventServiceBusApplicationProperties.cs");
        string source = File.ReadAllText(path);

        source.Should().Contain("TryGetProperty(\"severity\"");
        source.Should().Contain("TryGetProperty(\"deduplicationKey\"");
        source.Should().Contain("DeduplicationKeyPropertyName");
    }

    [Theory]
    [InlineData("SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md")]
    [InlineData("JIRA_ISSUE_VIA_POWER_AUTOMATE.md")]
    public void Power_automate_recipes_reference_publisher_correlation_keys_under_data(string recipeFile)
    {
        string root = TestRepositoryPaths.ResolveRepositoryRoot();
        string md = File.ReadAllText(Path.Combine(root, "docs", "integrations", "recipes", recipeFile));

        foreach (string key in new[]
                 {
                     "runId", "manifestId", "tenantId", "workspaceId", "projectId"
                 })
        {
            md.Should().Contain($"['data']?['{key}']", $"run-completed path should reference data.{key} ({recipeFile})");
        }

        foreach (string key in new[]
                 {
                     "alertId",
                     "ruleId",
                     "category",
                     "severity",
                     "title",
                     "deduplicationKey",
                     "tenantId",
                     "workspaceId",
                     "projectId"
                 })
        {
            md.Should().Contain($"['data']?['{key}']", $"alert path should reference data.{key} ({recipeFile})");
        }
    }
}
