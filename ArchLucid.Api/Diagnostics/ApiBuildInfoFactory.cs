using System.Diagnostics;

using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Api.Diagnostics;

/// <summary>Shared build identity payload for <c>GET /version</c> and <c>GET /health/version</c>.</summary>
internal static class ApiBuildInfoFactory
{
    private static readonly BuildProvenance Provenance =
        BuildProvenance.FromAssembly(typeof(ApiBuildInfoFactory).Assembly);

    internal static BuildInfoResponse Create(IHostEnvironment environment, IConfiguration configuration, TimeProvider timeProvider)
    {
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(timeProvider);

        Process process = Process.GetCurrentProcess();
        long processUptimeSeconds = (long)(timeProvider.GetUtcNow() - process.StartTime.ToUniversalTime()).TotalSeconds;

        return BuildInfoResponse.FromProvenance(
            Provenance,
            "ArchLucid.Api",
            environment.EnvironmentName,
            processUptimeSeconds,
            configuration);
    }
}
