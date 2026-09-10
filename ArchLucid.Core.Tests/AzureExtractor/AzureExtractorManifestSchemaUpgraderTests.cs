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
        manifestJson.Should().Contain("\"schemaVersion\":2");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_PascalCase_schema_version_property()
    {
        string manifestJson = """{"SchemaVersion":0,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_on_synonym_for_current_schema_version()
    {
        string manifestJson = """{"schemaVersion":"on","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_off_synonym_for_legacy_zero_schema_version()
    {
        string manifestJson = """{"schemaVersion":"off","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_string_whole_number_zero_schema_version()
    {
        string manifestJson = """{"schemaVersion":"0.0","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
    }

    [Fact]
    public void TryUpgradeManifestJson_accepts_string_whole_number_current_schema_version()
    {
        string manifestJson = """{"schemaVersion":"1.0","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_boolean_true_schema_version_at_current_version()
    {
        string manifestJson = """{"schemaVersion":true,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_string_true_schema_version_at_current_version()
    {
        string manifestJson = """{"schemaVersion":"true","tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().NotBeNullOrWhiteSpace();
    }
}
