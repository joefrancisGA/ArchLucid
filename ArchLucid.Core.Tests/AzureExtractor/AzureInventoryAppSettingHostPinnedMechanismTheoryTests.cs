using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

/// <summary>
///     Canonical parameterized pins for saturated /al-bug inventory-host ladder classes.
///     See docs/library/AL_BUG_INVENTORY_HOST_LADDER_SATURATION.md — do not add per-integer sibling tests.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAppSettingHostPinnedMechanismTheoryTests
{
    [Theory]
    [InlineData("e20")]
    [InlineData("e27")]
    [InlineData("e28")]
    public void ParseSettingValues_unsupported_cosmos_typo_en_suffix_without_https_scheme_yields_no_host(string suffixToken)
    {
        string value = $"AccountEndpoint=my.documents.azure.{suffixToken};AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Theory]
    [InlineData("\u1EC4")]
    [InlineData("\u1ECF")]
    [InlineData("\u1ED0")]
    [InlineData("\u1ED1")]
    public void ParseSettingValues_non_ascii_latin_extended_i_in_account_name_yields_no_blob_host(string glyph)
    {
        string value = $"AccountName=valid{glyph}name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Theory]
    [InlineData("\U00010FFFE")]
    [InlineData("\U00015FFFE")]
    [InlineData("\U00016FFFE")]
    public void TryParseKeyVaultReference_preserves_supplementary_plane_noncharacter_in_secret_segment(string noncharacter)
    {
        string secretWithNoncharacter = $"part1{noncharacter}part2";
        string reference =
            $"@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/{secretWithNoncharacter})";

        (string? keyVaultHost, string? secretName) = AzureInventoryAppSettingHostRedactor.TryParseKeyVaultReference(reference);

        keyVaultHost.Should().Be("myvault.vault.azure.net");
        secretName.Should().Be(secretWithNoncharacter);
    }

    [Theory]
    [InlineData(100)]
    [InlineData(176)]
    public void Parse_route_next_hop_percent_encoded_json_scalar_hits_eight_pass_decode_cap(int encodePasses)
    {
        const string nextHopIp = "10.0.0.4";
        string jsonStringScalar = JsonSerializer.Serialize(nextHopIp);
        string encoded = jsonStringScalar;
        for (int i = 0; i < encodePasses; i++)
        {
            encoded = Uri.EscapeDataString(encoded);
        }

        string routePrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] = "10.1.0.0/24",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] = "VirtualAppliance",
            [$"{routePrefix}{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] = encoded,
        };

        IReadOnlyList<AzureInventoryRouteTableRoute> routes = AzureInventoryRouteTableRouteParser.Parse(properties);

        routes.Should().ContainSingle();
        routes[0].NextHopIpAddress.Should().StartWith("%25");
        routes[0].NextHopIpAddress.Should().Contain("10.0.0.4");
        routes[0].NextHopIpAddress.Should().NotBe(nextHopIp);
    }
}
