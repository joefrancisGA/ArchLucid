using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Diagnostics;

/// <summary>Optional overrides for unit tests (no real SQL / HTTP).</summary>
internal sealed class DoctorQuickStartReadinessHooks
{
    internal Func<string?, bool, CancellationToken, Task<(DoctorReadinessLine Connection, DoctorReadinessLine Schema)>>?
        SqlAsync
    {
        get;
        init;
    }

    internal Func<IConfiguration, CancellationToken, Task<DoctorReadinessLine>>? OpenAiAsync { get; init; }
}
