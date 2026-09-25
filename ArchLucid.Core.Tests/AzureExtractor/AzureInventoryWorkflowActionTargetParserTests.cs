using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryWorkflowActionTargetParserTests
{
    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stnotify";

    [Fact]
    public void Parse_reads_action_targets_from_definition_json()
    {
        string definition = """
            {
              "actions": {
                "SendBlob": {
                  "type": "ApiConnection",
                  "inputs": {
                    "host": {
                      "connection": {
                        "name": "@parameters('$connections')['azureblob']"
                      }
                    },
                    "path": "/datasets/default/files",
                    "method": "post"
                  }
                },
                "CallStorage": {
                  "type": "Http",
                  "inputs": {
                    "uri": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stnotify"
                  }
                }
              }
            }
            """;

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["definition"] = definition,
        };

        IReadOnlyList<AzureInventoryWorkflowActionTarget> targets =
            AzureInventoryWorkflowActionTargetParser.Parse(properties);

        targets.Should().ContainSingle(action => action.ActionName == "CallStorage");
        targets.Single(action => action.ActionName == "CallStorage").TargetArmId
            .Should()
            .Be(ArmResourceIdNormalizer.Normalize(StorageArmId));
    }

    [Fact]
    public void Parse_ignores_display_name_only_actions()
    {
        string definition = """
            {
              "actions": {
                "LookupByName": {
                  "type": "Http",
                  "inputs": {
                    "uri": "https://stnotify.blob.core.windows.net"
                  }
                }
              }
            }
            """;

        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["definition"] = definition,
        };

        AzureInventoryWorkflowActionTargetParser.Parse(properties).Should().BeEmpty();
    }
}
