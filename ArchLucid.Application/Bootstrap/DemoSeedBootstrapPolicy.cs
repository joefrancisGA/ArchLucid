using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Hosting;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Decides when idempotent showcase/demo seed may run at host startup. Production customer workspaces must opt in
///     explicitly — never seed silently outside demo/trial/development contexts.
/// </summary>
public static class DemoSeedBootstrapPolicy
{
    /// <summary>
    ///     True when <paramref name="demo" /> is enabled and the host is development (with seed-on-startup), an explicit
    ///     CTO demo/showcase environment, or anonymous demo viewer packaging.
    /// </summary>
    public static bool ShouldSeedShowcaseOnStartup(IHostEnvironment environment, DemoOptions demo)
    {
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(demo);

        if (!demo.Enabled)
        {
            return false;
        }

        if (environment.IsDevelopment() && demo.SeedOnStartup)
        {
            return true;
        }

        if (demo.EnableShowcaseSeed)
        {
            return true;
        }

        if (demo.AnonymousViewer.Enabled)
        {
            return true;
        }

        return false;
    }
}
