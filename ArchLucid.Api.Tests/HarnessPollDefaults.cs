namespace ArchLucid.Api.Tests;

/// <summary>Shared poll iteration counts and delays for integration tests.</summary>
public static class HarnessPollDefaults
{
    public const int BackgroundJobDefaultMaxIterations = 25;

    public static readonly TimeSpan BackgroundJobDefaultDelay = TimeSpan.FromMilliseconds(200);

    public const int ItsmDurableCreateMaxIterations = 40;

    public static readonly TimeSpan ItsmDurableCreateDelay = TimeSpan.FromMilliseconds(100);
}
