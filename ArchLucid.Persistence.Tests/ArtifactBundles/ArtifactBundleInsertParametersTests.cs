using System.Reflection;

using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.ArtifactBundles;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactBundleInsertParametersTests
{
    [Fact]
    public void CreateBundleInsertParameters_keeps_inline_json_without_a_blob_uri()
    {
        object parameters = SqlArtifactBundleRepository.CreateBundleInsertParameters(
            Bundle(),
            "[{\"id\":1}]",
            "{\"trace\":true}",
            bundlePayloadBlobUri: null);

        Read<string>(parameters, "ArtifactsJson").Should().Be("[{\"id\":1}]");
        Read<string>(parameters, "TraceJson").Should().Be("{\"trace\":true}");
    }

    [Fact]
    public void CreateBundleInsertParameters_keeps_inline_json_for_an_empty_blob_uri()
    {
        object parameters = SqlArtifactBundleRepository.CreateBundleInsertParameters(
            Bundle(),
            "[{\"id\":1}]",
            "{\"trace\":true}",
            bundlePayloadBlobUri: "");

        Read<string>(parameters, "ArtifactsJson").Should().Be("[{\"id\":1}]");
        Read<string>(parameters, "TraceJson").Should().Be("{\"trace\":true}");
    }

    [Fact]
    public void CreateBundleInsertParameters_omits_inline_json_when_the_payload_was_offloaded()
    {
        object parameters = SqlArtifactBundleRepository.CreateBundleInsertParameters(
            Bundle(),
            "[{\"id\":1}]",
            "{\"trace\":true}",
            "https://blobs/artifact-bundles/bundle.json");

        Read<string>(parameters, "ArtifactsJson").Should().BeEmpty();
        Read<string>(parameters, "TraceJson").Should().BeEmpty();
        Read<string>(parameters, "BundlePayloadBlobUri")
            .Should()
            .Be("https://blobs/artifact-bundles/bundle.json");
    }

    private static ArtifactBundle Bundle() =>
        new()
        {
            BundleId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001"),
            RunId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002"),
            ManifestId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003"),
            TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000004"),
            WorkspaceId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000005"),
            ProjectId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000006"),
            CreatedUtc = DateTime.Parse("2026-11-21T00:00:00Z")
        };

    private static T Read<T>(object parameters, string propertyName)
    {
        PropertyInfo? property = parameters.GetType().GetProperty(propertyName);
        property.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        object? value = property!.GetValue(parameters);
        value.Should().NotBeNull();
        return (T)value!;
    }
}
