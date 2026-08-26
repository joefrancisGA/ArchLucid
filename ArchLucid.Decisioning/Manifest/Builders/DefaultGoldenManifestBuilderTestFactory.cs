namespace ArchLucid.Decisioning.Manifest.Builders;

/// <summary>
///     Constructs <see cref="DefaultGoldenManifestBuilder" /> with default section populators for unit tests.
/// </summary>
public static class DefaultGoldenManifestBuilderTestFactory
{
    public static DefaultGoldenManifestBuilder Create() =>
        new(
            new TopologyManifestSectionPopulator(),
            new SecurityManifestSectionPopulator(),
            new CostManifestSectionPopulator());
}
