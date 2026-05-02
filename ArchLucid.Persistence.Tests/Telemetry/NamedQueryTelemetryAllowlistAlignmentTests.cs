using System.Reflection;
using System.Text.Json;

using ArchLucid.Persistence.Telemetry;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Telemetry;

/// <summary>TB-003: <see cref="NamedQueryTelemetryNames" /> string values stay 1:1 with <c>tests/performance/query-allowlist.json</c>.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class NamedQueryTelemetryAllowlistAlignmentTests
{
    [Fact]
    public void Named_query_telemetry_constants_match_query_allowlist_json_bidirectionally()
    {
        string root = PersistenceTestsRepositoryPaths.ResolveRepositoryRoot();
        string allowlistPath = Path.Combine(root, "tests", "performance", "query-allowlist.json");

        File.Exists(allowlistPath).Should().BeTrue($"missing {allowlistPath}");

        using JsonDocument doc = JsonDocument.Parse(File.ReadAllText(allowlistPath));

        doc.RootElement.ValueKind.Should().Be(JsonValueKind.Array);

        HashSet<string> allowNames = doc.RootElement
            .EnumerateArray()
            .Select(row => row.GetProperty("name").GetString()!)
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> telemetryNames = typeof(NamedQueryTelemetryNames)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(f => f.FieldType == typeof(string))
            .Select(f => (string)f.GetValue(null)!)
            .ToHashSet(StringComparer.Ordinal);

        allowNames.Should().BeEquivalentTo(
            telemetryNames,
            "`tests/performance/query-allowlist.json` and `NamedQueryTelemetryNames` query_name sets must stay identical (every instrumented gate has a CI threshold)");
    }
}
