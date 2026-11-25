using System.Text.Json;
using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryEventGridDeadLetterEvidenceTests
{
    private const string Account = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa";
    private const string Destination = """{"endpointType":"StorageBlob","properties":{"resourceId":"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa","blobContainerName":"deadletters"}}""";

    [Fact]
    public void Extract_direct_destination_does_not_claim_authorization()
    {
        using JsonDocument document = JsonDocument.Parse("{\"deadLetterDestination\":" + Destination + "}");
        var result = AzureInventoryEventGridDeadLetterEvidence.Extract(document.RootElement);
        Assert.Equal("configured", result.Status);
        Assert.Equal(Account + "/blobServices/default/containers/deadletters", result.ResourceId);
        Assert.Equal("direct-unverified", result.Authentication);
    }

    [Fact]
    public void Extract_independent_system_identity()
    {
        using JsonDocument document = JsonDocument.Parse(
            "{\"deadLetterWithResourceIdentity\":{\"identity\":{\"type\":\"SystemAssigned\"},\"deadLetterDestination\":" + Destination + "}}");
        var result = AzureInventoryEventGridDeadLetterEvidence.Extract(document.RootElement);
        Assert.Equal("configured", result.Status);
        Assert.Equal("system-assigned", result.Authentication);
    }

    [Theory]
    [InlineData("{}", "not-observed")]
    [InlineData("""{"deadLetterDestination":{}}""", "unknown")]
    [InlineData("""{"deadLetterDestination":{},"deadLetterWithResourceIdentity":{}}""", "unknown")]
    public void Extract_distinguishes_missing_and_invalid_configuration(string json, string expected)
    {
        using JsonDocument document = JsonDocument.Parse(json);
        Assert.Equal(expected, AzureInventoryEventGridDeadLetterEvidence.Extract(document.RootElement).Status);
    }

    [Theory]
    [InlineData("bad/path")]
    [InlineData("container?secret=value")]
    [InlineData("")]
    public void BuildContainerResourceId_rejects_invalid_names(string container)
    {
        Assert.Null(AzureInventoryEventGridDeadLetterEvidence.BuildContainerResourceId(Account, container));
    }
}
