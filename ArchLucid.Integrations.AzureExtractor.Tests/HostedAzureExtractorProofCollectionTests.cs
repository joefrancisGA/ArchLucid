using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

public sealed class HostedAzureExtractorProofCollectionTests
{
    [Fact]
    public void BuildZip_stamps_role_name_and_preserves_linked_service_rows_without_app_settings()
    {
        byte[] zipBytes = HostedAzureExtractorZipBuilder.BuildZip(
            "sub",
            [],
            false,
            DateTimeOffset.UtcNow,
            roleAssignments:
            [
                new HostedAzureArmRoleAssignmentRecord(
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault",
                    "principal",
                    "ServicePrincipal",
                    "/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f60684581c14",
                    RoleName: "Reader"),
            ],
            adfLinkedServices:
            [
                new AzureInventoryAdfLinkedServiceRow
                {
                    FactoryResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/factory",
                    LinkedServiceResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/factory/linkedservices/store",
                    LinkedServiceName = "store",
                    LinkedServiceType = "AzureBlobStorage",
                    TargetResourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/store",
                },
            ]);

        using MemoryStream stream = new(zipBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read);

        JsonElement roleAssignment = ReadFirstArrayItem(archive, "role-assignments.json");
        JsonElement linkedService = ReadFirstArrayItem(archive, "adf-linked-services.json");

        Assert.Equal("Reader", roleAssignment.GetProperty("roleName").GetString());
        Assert.Equal(
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault",
            roleAssignment.GetProperty("scope").GetString());
        Assert.Equal("store", linkedService.GetProperty("linkedServiceName").GetString());
        Assert.DoesNotContain(
            archive.Entries,
            entry => entry.FullName.Contains("app", StringComparison.OrdinalIgnoreCase)
                && entry.FullName.Contains("setting", StringComparison.OrdinalIgnoreCase));
    }

    private static JsonElement ReadFirstArrayItem(ZipArchive archive, string entryName)
    {
        ZipArchiveEntry entry = Assert.Single(
            archive.Entries,
            candidate => string.Equals(candidate.FullName, entryName, StringComparison.OrdinalIgnoreCase));

        using Stream stream = entry.Open();
        using JsonDocument document = JsonDocument.Parse(stream);

        return document.RootElement.EnumerateArray().First().Clone();
    }
}
