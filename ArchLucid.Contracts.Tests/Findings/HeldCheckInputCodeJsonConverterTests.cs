using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class HeldCheckInputCodeJsonConverterTests
{
    [Theory]
    [InlineData("\"AzureInventoryZip\"", HeldCheckInputCode.AzureInventoryZip)]
    [InlineData("0", HeldCheckInputCode.AzureInventoryZip)]
    [InlineData("0.0", HeldCheckInputCode.AzureInventoryZip)]
    [InlineData("\"AssignedPolicyPack\"", HeldCheckInputCode.AssignedPolicyPack)]
    [InlineData("9", HeldCheckInputCode.AssignedPolicyPack)]
    public void Read_maps_defined_values(string json, HeldCheckInputCode expected)
    {
        HeldCheckInputCode value = JsonSerializer.Deserialize<HeldCheckInputCode>(json, JsonSerializerOptions.Default);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_string_numeric_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<HeldCheckInputCode>("\"99\"", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown held check input code value*");
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<HeldCheckInputCode>("99", JsonSerializerOptions.Default);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown held check input code value*");
    }

    [Fact]
    public void Rollup_entry_rejects_undefined_input_code_ordinal()
    {
        const string json = """{"inputCode":99,"engineCount":1,"engineTypes":[]}""";

        Action act = () => JsonSerializer.Deserialize<HeldCheckLedgerRollupEntry>(json, ContractJson.CamelCaseCompact);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown held check input code value*");
    }
}
