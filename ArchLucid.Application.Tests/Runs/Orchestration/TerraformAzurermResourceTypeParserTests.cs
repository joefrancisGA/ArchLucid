using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TerraformAzurermResourceTypeParserTests
{
    [Fact]
    public void TryStripTrailingInstanceKey_treats_quoted_and_unquoted_for_each_keys_as_same_root()
    {
        const string root = "azurerm_app_service.main";

        TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey($"{root}[\"primary\"]")
            .Should()
            .Be(root);

        TerraformAzurermResourceTypeParser.TryStripTrailingInstanceKey($"{root}[primary]")
            .Should()
            .Be(root);
    }

    [Fact]
    public void CanonicalizeTerraformAddressForLookup_strips_single_and_double_quotes_from_instance_keys()
    {
        const string root = "azurerm_app_service.main";

        TerraformAzurermResourceTypeParser.CanonicalizeTerraformAddressForLookup($"{root}['primary']")
            .Should()
            .Be($"{root}[primary]");

        TerraformAzurermResourceTypeParser.CanonicalizeTerraformAddressForLookup($"{root}[\"primary\"]")
            .Should()
            .Be($"{root}[primary]");
    }
}
