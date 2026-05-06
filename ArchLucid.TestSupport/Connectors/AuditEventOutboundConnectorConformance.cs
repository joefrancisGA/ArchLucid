using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.TestSupport.Connectors;

/// <summary>Shared assertions for first-party connector audit rows (scope, safe payloads, optional correlation).</summary>
public static class AuditEventOutboundConnectorConformance
{
    /// <summary>Substrings that must not appear in connector audit JSON intended for operators.</summary>
    private static readonly string[] ForbiddenAuditSecretMarkers =
    [
        "apiToken",
        "api_token",
        "refresh_token",
        "client_secret",
        "hooks.slack.com",
        "webhook.office.com",
        "Bearer ",
        "Basic "
    ];

    public static void AssertScopePreserved(string connectorName, ScopeContext expected, AuditEvent actual)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        ArgumentNullException.ThrowIfNull(expected);
        ArgumentNullException.ThrowIfNull(actual);

        actual.TenantId.Should().Be(expected.TenantId, because: $"{connectorName}: audit TenantId must match request scope.");
        actual.WorkspaceId.Should().Be(expected.WorkspaceId, because: $"{connectorName}: audit WorkspaceId must match request scope.");
        actual.ProjectId.Should().Be(expected.ProjectId, because: $"{connectorName}: audit ProjectId must match request scope.");
    }

    public static void AssertAuditDataExcludesSecretMaterial(string connectorName, string? dataJson)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        string haystack = dataJson ?? string.Empty;

        foreach (string forbidden in ForbiddenAuditSecretMarkers)
        {
            haystack.Should().NotContain(forbidden, because: $"{connectorName}: audit DataJson must not echo `{forbidden}`.");
        }
    }

    public static void AssertCorrelationIdWhenExpected(string connectorName, string? expectedCorrelationId, AuditEvent actual)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        ArgumentNullException.ThrowIfNull(actual);

        if (string.IsNullOrWhiteSpace(expectedCorrelationId))
            return;

        actual.CorrelationId.Should().Be(expectedCorrelationId,
            because: $"{connectorName}: CorrelationId must propagate to audit when supplied by the host.");
    }

    public static void AssertAuditDataContainsFindingIdWhenPresent(string connectorName, string findingId, string? dataJson)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        if (string.IsNullOrWhiteSpace(dataJson))
            return;

        using JsonDocument doc = JsonDocument.Parse(dataJson);

        if (!doc.RootElement.TryGetProperty("findingId", out JsonElement prop))
            return;

        prop.GetString().Should().Be(findingId, because: $"{connectorName}: audit findingId must match the outbound subject.");
    }
}
