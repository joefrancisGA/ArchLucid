using ArchLucid.ArtifactSynthesis.Classifiers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests.Classifiers;

[Trait("Category", "Unit")]
public sealed class AzureInventorySecurityBaselineClassifierTests
{
    [Fact]
    public void ClassifyFromResourcesJson_flags_storage_account_with_blob_public_access()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/publicsa",
                "properties": {
                  "allowBlobPublicAccess": true
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("data-protection");
        findings[0].ResourceId.Should().Contain("publicsa");
    }

    [Fact]
    public void ClassifyFromResourcesJson_flags_nsg_with_open_admin_ingress()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Network/networkSecurityGroups",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
                "properties": {
                  "securityRules": [
                    {
                      "properties": {
                        "access": "Allow",
                        "direction": "Inbound",
                        "sourceAddressPrefix": "*",
                        "destinationPortRange": "3389"
                      }
                    }
                  ]
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("network-isolation");
    }

    [Fact]
    public void ClassifyFromResourcesJson_flags_sql_server_with_weak_tls()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Sql/servers",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1",
                "properties": {
                  "minimalTlsVersion": "1.0"
                }
              }
            ]
            """;

        IReadOnlyList<InventorySecurityBaselineFinding> findings =
            AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson);

        findings.Should().ContainSingle();
        findings[0].ControlFamily.Should().Be("encryption");
    }

    [Fact]
    public void ClassifyFromResourcesJson_returns_empty_for_compliant_rows()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/safe",
                "properties": {
                  "allowBlobPublicAccess": false
                }
              }
            ]
            """;

        AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson).Should().BeEmpty();
    }

    [Fact]
    public void ClassifyFromResourcesJson_does_not_flag_non_admin_port_ranges()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Network/networkSecurityGroups",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg1",
                "properties": {
                  "securityRules": [
                    {
                      "properties": {
                        "access": "Allow",
                        "direction": "Inbound",
                        "sourceAddressPrefix": "*",
                        "destinationPortRange": "1022-1050"
                      }
                    }
                  ]
                }
              }
            ]
            """;

        AzureInventorySecurityBaselineClassifier.ClassifyFromResourcesJson(resourcesJson).Should().BeEmpty();
    }
}
