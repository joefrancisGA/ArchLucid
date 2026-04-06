using System.Text.Json;

using ArchiForge.Persistence.Serialization;

using FluentAssertions;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Audit payloads use <see cref="AuditJsonSerializationOptions"/> so stored <c>DataJson</c> stays camelCase for operators and downstream tools.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AuditJsonSerializationContractTests
{
    [Fact]
    public void Serializes_anonymous_audit_payload_with_camelCase_property_names()
    {
        string json = JsonSerializer.Serialize(
            new
            {
                AlertId = Guid.NewGuid(),
                RuleName = "High count",
                Nested = new { InnerValue = 3 }
            },
            AuditJsonSerializationOptions.Instance);

        using JsonDocument doc = JsonDocument.Parse(json);
        JsonElement root = doc.RootElement;

        root.TryGetProperty("alertId", out _).Should().BeTrue("alertId must be camelCase");
        root.TryGetProperty("ruleName", out _).Should().BeTrue("ruleName must be camelCase");
        root.TryGetProperty("nested", out JsonElement nested).Should().BeTrue();
        nested.TryGetProperty("innerValue", out JsonElement inner).Should().BeTrue();
        inner.GetInt32().Should().Be(3);
    }
}
