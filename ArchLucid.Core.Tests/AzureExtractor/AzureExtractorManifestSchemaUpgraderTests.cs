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

    [Fact]
    public void TryUpgradeManifestJson_rejects_missing_schemaVersion()
    {
        string manifestJson = """{"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("schemaVersion");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_schema_zero_with_legacy_defaults()
    {
        string manifestJson = """{"schemaVersion":0,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
        manifestJson.Should().Contain("\"scriptVersion\":\"legacy-0.x\"");
        manifestJson.Should().Contain("\"switchesUsed\":[]");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_schema_one_to_two_with_defaults()
    {
        string manifestJson =
            """{"schemaVersion":1,"tenantId":"contoso","scriptVersion":"2.4.1","completenessScore":0.75}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
        manifestJson.Should().Contain("\"completenessScore\":0.75");
        manifestJson.Should().Contain("\"collectorVersion\":\"2.4.1\"");
        manifestJson.Should().Contain("\"warnings\":[]");
        manifestJson.Should().Contain("\"errors\":[]");
    }

    [Fact]
    public void TryUpgradeManifestJson_upgrades_string_one_schema_version()
    {
        string manifestJson = """{"schemaVersion":"1","tenantId":"contoso","scriptVersion":"2.4.1"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
        manifestJson.Should().Contain("\"collectorVersion\":\"2.4.1\"");
    }

    [Fact]
    public void TryUpgradeManifestJson_preserves_existing_switches_used_on_schema_zero_upgrade()
    {
        string manifestJson =
            """{"schemaVersion":0,"tenantId":"contoso","switchesUsed":["IncludeNetwork","IncludePolicy"]}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("IncludeNetwork");
        manifestJson.Should().Contain("IncludePolicy");
    }

    [Fact]
    public void TryUpgradeManifestJson_preserves_existing_warnings_and_errors_on_schema_one_upgrade()
    {
        string manifestJson =
            """{"schemaVersion":1,"tenantId":"contoso","warnings":["partial capture"],"errors":["skipped resource"],"completenessScore":0.5}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("partial capture");
        manifestJson.Should().Contain("skipped resource");
        manifestJson.Should().Contain("\"completenessScore\":0.5");
    }

    [Fact]
    public void TryUpgradeManifestJson_preserves_existing_script_version_on_schema_zero_upgrade()
    {
        string manifestJson = """{"schemaVersion":0,"tenantId":"contoso","scriptVersion":"3.1.0"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"collectorVersion\":\"3.1.0\"");
        manifestJson.Should().NotContain("legacy-0.x");
    }

    [Fact]
    public void TryUpgradeManifestJson_adds_default_metadata_on_schema_one_upgrade()
    {
        string manifestJson = """{"schemaVersion":1,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
        manifestJson.Should().Contain("\"resourceCount\":0");
        manifestJson.Should().Contain("\"captureMethod\":\"CustomerScript\"");
        manifestJson.Should().Contain("\"collectorVersion\":\"unknown\"");
    }

    [Fact]
    public void TryUpgradeManifestJson_accepts_already_current_schema_two_without_mutation()
    {
        string manifestJson = """{"schemaVersion":2,"tenantId":"contoso","completenessScore":0.9}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":2");
        manifestJson.Should().Contain("\"completenessScore\":0.9");
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_whitespace_manifest_json()
    {
        string manifestJson = "   ";

        Action act = () => AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out _);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_unsupported_legacy_schema_version()
    {
        string manifestJson = """{"schemaVersion":-1,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("Unsupported legacy manifest schemaVersion");
    }

    [Fact]
    public void TryUpgradeManifestJson_accepts_schema_versions_at_or_above_current_without_mutation()
    {
        string manifestJson = """{"schemaVersion":99,"tenantId":"contoso"}""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeTrue();
        error.Should().BeNull();
        manifestJson.Should().Contain("\"schemaVersion\":99");
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_malformed_json()
    {
        string manifestJson = "{ not-valid-json";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().Be("manifest.json is not valid JSON.");
    }

    [Fact]
    public void TryUpgradeManifestJson_rejects_non_object_root()
    {
        string manifestJson = """["not-an-object"]""";

        bool ok = AzureExtractorManifestSchemaUpgrader.TryUpgradeManifestJson(ref manifestJson, out string? error);

        ok.Should().BeFalse();
        error.Should().Contain("manifest.json root must be an object");
    }
}
