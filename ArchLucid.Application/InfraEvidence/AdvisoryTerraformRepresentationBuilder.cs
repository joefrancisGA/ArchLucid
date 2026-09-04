using ArchLucid.ArtifactSynthesis.Packaging;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;
public static class AdvisoryTerraformRepresentationBuilder
{
    public static AdvisoryTerraformBuildResult Build(
        AzureInventorySnapshotDetailReadModel snapshot,
        bool aztfexportAvailable)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        AdvisoryTerraformGenerationMethod generationMethod = aztfexportAvailable
            ? AdvisoryTerraformGenerationMethod.HybridAztfexportAndReconstruction
            : AdvisoryTerraformGenerationMethod.SnapshotReconstruction;

        List<AdvisoryTerraformResourceMappingRecord> mappings = [];
        Dictionary<string, List<string>> folderBlocks = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources
                     .OrderBy(r => r.AzureResourceId, StringComparer.Ordinal))
        {
            AdvisoryTerraformAddressInfo address = AdvisoryTerraformAddressBuilder.Build(resource);
            string uncertainty = generationMethod == AdvisoryTerraformGenerationMethod.SnapshotReconstruction
                ? "Reconstructed from inventory snapshot; verify resource arguments before apply."
                : "Hybrid: prefer aztfexport output when available; reconstruction fills gaps only.";

            mappings.Add(new AdvisoryTerraformResourceMappingRecord
            {
                MappingId = Guid.NewGuid(),
                SnapshotId = snapshot.Header.SnapshotId,
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                TerraformAddress = address.TerraformAddress,
                CategoryFolder = address.CategoryFolder,
                GenerationMethod = generationMethod,
                UncertaintyNotes = uncertainty,
            });

            if (!folderBlocks.TryGetValue(address.CategoryFolder, out List<string>? blocks))
            {
                blocks = [];
                folderBlocks[address.CategoryFolder] = blocks;
            }

            blocks.Add(
                "# " + TerraformAdvisoryExportCopy.DisclaimerLine + Environment.NewLine
                + "# arm.id=" + resource.AzureResourceId + Environment.NewLine
                + "# arm.type=" + resource.ResourceType + Environment.NewLine
                + "# reconstruction-only — not original Terraform" + Environment.NewLine
                + "# " + uncertainty + Environment.NewLine
                + "# resource \"" + address.TerraformResourceType + "\" \"" + address.TerraformName + "\" {" + Environment.NewLine
                + "#   # TODO: populate from snapshot properties or aztfexport" + Environment.NewLine
                + "# }" + Environment.NewLine);
        }

        Dictionary<string, string> files = new(StringComparer.OrdinalIgnoreCase)
        {
            ["providers.tf"] = BuildProvidersTf(),
            ["versions.tf"] = BuildVersionsTf(),
            ["ADVISORY.md"] = TerraformAdvisoryExportCopy.AdvisoryMarkdownBody.Trim() + Environment.NewLine,
        };

        foreach (KeyValuePair<string, List<string>> folder in folderBlocks.OrderBy(f => f.Key, StringComparer.Ordinal))
        {
            files[$"{folder.Key}/reconstruction.tf"] = string.Join(Environment.NewLine, folder.Value) + Environment.NewLine;
        }

        byte[] hash = AdvisoryTerraformContentHasher.Compute(files);

        return new AdvisoryTerraformBuildResult
        {
            Mappings = mappings,
            Files = files,
            ContentHashSha256 = hash,
            GenerationMethod = generationMethod,
        };
    }

    private static string BuildProvidersTf() =>
        """
        # ArchLucid advisory reconstruction — review before apply.
        terraform {
          required_providers {
            azurerm = {
              source  = "hashicorp/azurerm"
              version = "~> 3.0"
            }
          }
        }

        provider "azurerm" {
          features {}
        }
        """ + Environment.NewLine;

    private static string BuildVersionsTf() =>
        """
        # ArchLucid advisory reconstruction — versions stub.
        terraform {
          required_version = ">= 1.5.0"
        }
        """ + Environment.NewLine;
}

public sealed class AdvisoryTerraformBuildResult
{
    public IReadOnlyList<AdvisoryTerraformResourceMappingRecord> Mappings
    {
        get;
        init;
    } = [];

    public IReadOnlyDictionary<string, string> Files
    {
        get;
        init;
    } = new Dictionary<string, string>();

    public byte[] ContentHashSha256
    {
        get;
        init;
    } = [];

    public AdvisoryTerraformGenerationMethod GenerationMethod
    {
        get;
        init;
    }
}
