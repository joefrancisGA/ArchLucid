namespace ArchLucid.Core.Configuration;

internal static class HostedExtractorCollectionTimeout
{
    public const int DefaultSeconds = 1_800;

    public static TimeSpan Resolve(int configuredSeconds) =>
        TimeSpan.FromSeconds(Math.Clamp(configuredSeconds, 30, 7_200));
}
