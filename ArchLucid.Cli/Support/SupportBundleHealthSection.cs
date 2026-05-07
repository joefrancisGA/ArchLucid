using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

public sealed class SupportBundleHealthSection
{
    /// <summary>Relative paths probed for this bundle (stable operator signal).</summary>
    [JsonPropertyName("attemptedHealthRelativePaths")]
    public IReadOnlyList<string> AttemptedHealthRelativePaths
    {
        get;
        init;
    } = [];

    [JsonPropertyName("live")]
    public SupportBundleHealthProbe Live
    {
        get;
        init;
    } = new();

    [JsonPropertyName("ready")]
    public SupportBundleHealthProbe Ready
    {
        get;
        init;
    } = new();

    [JsonPropertyName("combined")]
    public SupportBundleHealthProbe Combined
    {
        get;
        init;
    } = new();
}
