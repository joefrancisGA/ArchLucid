using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestFingerprintTests
{
    [Fact]
    public void ComputeSha256Hex_is_deterministic_for_equivalent_manifest()
    {
        DateTime createdUtc = new(2026, 4, 21, 12, 0, 0, DateTimeKind.Utc);

        GoldenManifest a = new()
        {
            RunId = "run-a",
            SystemName = "Sys",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1-test", CreatedUtc = createdUtc }
        };

        GoldenManifest b = new()
        {
            RunId = "run-a",
            SystemName = "Sys",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1-test", CreatedUtc = createdUtc }
        };

        string ha = GoldenManifestFingerprint.ComputeSha256Hex(a);
        string hb = GoldenManifestFingerprint.ComputeSha256Hex(b);

        ha.Should().Be(hb);
        ha.Length.Should().Be(64);
    }

    [Fact]
    public void ComputeSha256Hex_throws_when_manifest_null()
    {
        Action act = () => GoldenManifestFingerprint.ComputeSha256Hex(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("manifest");
    }

    [Fact]
    public void ComputeSha256HexFromManifestJson_throws_when_json_null()
    {
        Action act = () => GoldenManifestFingerprint.ComputeSha256HexFromManifestJson(null!);

        act.Should().Throw<ArgumentException>().WithParameterName("manifestJson");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ComputeSha256HexFromManifestJson_throws_when_json_whitespace(string manifestJson)
    {
        Action act = () => GoldenManifestFingerprint.ComputeSha256HexFromManifestJson(manifestJson);

        act.Should().Throw<ArgumentException>().WithParameterName("manifestJson");
    }

    [Fact]
    public void ComputeSha256HexFromManifestJson_throws_when_deserialized_manifest_null()
    {
        Action act = () => GoldenManifestFingerprint.ComputeSha256HexFromManifestJson("null");

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void ComputeSha256HexFromManifestJson_round_trips_stable_hex()
    {
        DateTime createdUtc = new(2026, 4, 21, 12, 0, 0, DateTimeKind.Utc);

        GoldenManifest manifest = new()
        {
            RunId = "run-json",
            SystemName = "Sys",
            Services = [],
            Datastores = [],
            Relationships = [],
            Governance = new ManifestGovernance(),
            Metadata = new ManifestMetadata { ManifestVersion = "v1-json", CreatedUtc = createdUtc }
        };

        string json = JsonSerializer.Serialize(manifest, ContractJson.Default);
        string fromJson = GoldenManifestFingerprint.ComputeSha256HexFromManifestJson(json);
        string direct = GoldenManifestFingerprint.ComputeSha256Hex(manifest);

        fromJson.Should().Be(direct);
    }
}
