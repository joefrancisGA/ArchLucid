using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorManifestSchemaUpgraderTests
{
    [Fact]
    public void TryUpgradeManifestJson_upgrades_string_zero_schema_version()
    {
        string manifestJson = """{"schemaVersion":"0","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":1");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_PascalCase_schema_version_property()
    {
        string manifestJson = """{"SchemaVersion":0,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":1");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_string_off_synonym_zero_schema_version()
    {
        string manifestJson = """{"schemaVersion":"off","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":1");
    }

    [Fact]
    public void TryUpgradeManifestJson_accepts_string_whole_number_one_point_zero_schema_version()
    {
        string manifestJson = """{"schemaVersion":"1.0","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
    }
}
