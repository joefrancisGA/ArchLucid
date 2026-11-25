using System.Text.Json;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridDiagnosticEvidenceTests
{
    private const string Target = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic";
    private const string Workspace = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws";

    [Theory]
    [InlineData("""[{"category":"DeliveryFailures","enabled":true}]""", true)]
    [InlineData("""[{"category":"DeliveryFailures","enabled":false}]""", false)]
    [InlineData("""[{"categoryGroup":"allLogs","enabled":true}]""", true)]
    [InlineData("""[{"categoryGroup":"allLogs","enabled":false}]""", false)]
    [InlineData("""[{"category":"PublishFailures","enabled":true}]""", false)]
    [InlineData("""[{"category":"DeliveryFailures","enabled":"true"}]""", false)]
    [InlineData("null", false)]
    [InlineData("[]", false)]
    public void Routed_category_requires_explicit_enabled_evidence(string logs, bool expected)
    {
        using JsonDocument document = JsonDocument.Parse(
            "{\"targetResourceId\":\"" + Target + "\",\"workspaceId\":\"" + Workspace + "\",\"logs\":" + logs + "}");
        Assert.Equal(expected, AzureInventoryEventGridDiagnosticEvidence.HasRoutedCategory(
            Target, "DeliveryFailures", [document.RootElement]));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("https://example.com")]
    [InlineData("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm")]
    public void Routed_category_requires_supported_destination(string? destination)
    {
        JsonElement setting = JsonSerializer.SerializeToElement(new
        {
            targetResourceId = Target, workspaceId = destination,
            logs = new[] { new { category = "DeliveryFailures", enabled = true } },
        });
        Assert.False(AzureInventoryEventGridDiagnosticEvidence.HasRoutedCategory(Target, "DeliveryFailures", [setting]));
    }

    [Fact]
    public void Unrelated_target_does_not_supply_coverage()
    {
        JsonElement setting = JsonSerializer.SerializeToElement(new
        {
            targetResourceId = Target + "2", workspaceId = Workspace,
            logs = new[] { new { category = "DeliveryFailures", enabled = true } },
        });
        Assert.False(AzureInventoryEventGridDiagnosticEvidence.HasRoutedCategory(Target, "DeliveryFailures", [setting]));
    }

    [Fact]
    public void Reader_preserves_disabled_entries_and_distinguishes_missing_from_empty()
    {
        using JsonDocument valid = JsonDocument.Parse("""{"logs":[{"category":"DeliveryFailures","enabled":false}]}""");
        using JsonDocument empty = JsonDocument.Parse("""{"logs":[]}""");
        using JsonDocument missing = JsonDocument.Parse("{}");
        Assert.False(Assert.Single(AzureInventoryDiagnosticLogCategory.Read(valid.RootElement)!).Enabled);
        Assert.Empty(AzureInventoryDiagnosticLogCategory.Read(empty.RootElement)!);
        Assert.Null(AzureInventoryDiagnosticLogCategory.Read(missing.RootElement));
    }
}
