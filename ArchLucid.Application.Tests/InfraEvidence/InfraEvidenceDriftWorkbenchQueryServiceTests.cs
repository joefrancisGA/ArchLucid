using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfraEvidenceDriftWorkbenchQueryServiceTests
{
    [Fact]
    public async Task ListSnapshotsAsync_with_no_op_repositories_returns_paged_empty()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        InfraEvidenceDriftWorkbenchQueryService service = new(
            new NoOpAzureInventorySnapshotRepository(),
            new NoOpAzureInventoryDiffRepository());

        PagedResponse<AzureInventorySnapshotRecord> response = await service.ListSnapshotsAsync(
            scope,
            page: 1,
            pageSize: 50,
            subscriptionId: null,
            CancellationToken.None);

        response.Items.Should().BeEmpty();
        response.TotalCount.Should().Be(0);
        response.Page.Should().Be(1);
        response.PageSize.Should().Be(50);
    }

    [Fact]
    public void AdvisoryTerraformZipBuilder_includes_advisory_markdown_and_mapping_csv_with_disclaimer()
    {
        AdvisoryTerraformRepresentationResult result = new()
        {
            Succeeded = true,
            SnapshotId = Guid.NewGuid(),
            Files = new Dictionary<string, string>
            {
                ["ADVISORY.md"] = TerraformAdvisoryExportCopy.AdvisoryMarkdownBody.Trim() + Environment.NewLine,
            },
            Mappings =
            [
                new AdvisoryTerraformResourceMappingRecord
                {
                    MappingId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    CloudResourceId = Guid.NewGuid(),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    TerraformAddress = "azurerm_storage_account.sa1",
                    CategoryFolder = "storage",
                    GenerationMethod = AdvisoryTerraformGenerationMethod.SnapshotReconstruction,
                    UncertaintyNotes = TerraformAdvisoryExportCopy.DisclaimerLine,
                },
            ],
        };

        byte[] zipBytes = AdvisoryTerraformZipBuilder.BuildZip(result);

        using MemoryStream memoryStream = new(zipBytes);
        using ZipArchive archive = new(memoryStream, ZipArchiveMode.Read);

        ZipArchiveEntry? advisoryEntry = archive.GetEntry("ADVISORY.md");
        advisoryEntry.Should().NotBeNull();

        using Stream advisoryStream = advisoryEntry!.Open();
        using StreamReader advisoryReader = new(advisoryStream, Encoding.UTF8);
        string advisoryText = advisoryReader.ReadToEnd();
        advisoryText.Should().Contain("advisory");

        ZipArchiveEntry? mappingEntry = archive.GetEntry("mapping.csv");
        mappingEntry.Should().NotBeNull();

        using Stream mappingStream = mappingEntry!.Open();
        using StreamReader mappingReader = new(mappingStream, Encoding.UTF8);
        string mappingText = mappingReader.ReadToEnd();
        mappingText.Should().Contain("CloudResourceId,AzureResourceId,TerraformAddress,CategoryFolder,GenerationMethod,UncertaintyNotes");
        mappingText.Should().Contain(TerraformAdvisoryExportCopy.DisclaimerLine);
    }
}
