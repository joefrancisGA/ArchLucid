using System.IO.Compression;

using ArchLucid.Core.CloudInventoryExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.CloudInventoryExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CloudInventoryExtractorPackageZipValidatorManifestShapeTests
{
    [Fact]
    public void Validate_non_object_manifest_is_schema_rejection_instead_of_throwing()
    {
        using MemoryStream package = new();

        using (ZipArchive archive = new(package, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifest = archive.CreateEntry("manifest.json");

            using (StreamWriter writer = new(manifest.Open()))
            {
                writer.Write("[]");
            }

            ZipArchiveEntry resources = archive.CreateEntry("resources.json");

            using StreamWriter resourcesWriter = new(resources.Open());
            resourcesWriter.Write("[]");
        }

        package.Position = 0;

        Func<CloudInventoryExtractorZipValidationResult> act =
            () => CloudInventoryExtractorPackageZipValidator.Validate(package);

        CloudInventoryExtractorZipValidationResult result = act.Should().NotThrow().Which;
        result.IsValid.Should().BeFalse();
        result.IsSchemaRejection.Should().BeTrue();
        result.ErrorDetail.Should().Contain("schemaVersion");
    }
}
