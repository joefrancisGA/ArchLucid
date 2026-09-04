using ArchLucid.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Commands;

internal static partial class DoctorCommand
{
    /// <summary>
    ///     After the API responds to liveness, replay <see cref="ProductionLikeHostingMisconfigurationAdvisor" /> against
    ///     this process environment (same inputs the API host typically receives via env vars).
    /// </summary>
    private static void PrintHostingMisconfigurationHintsFromLocalEnvironment(bool apiHostLiveResponded)
    {
        if (!apiHostLiveResponded)
            return;

        IConfiguration configuration = new ConfigurationBuilder().AddEnvironmentVariables().Build();

        string envName =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? Environments.Production;

        IReadOnlyList<string> hints =
            ProductionLikeHostingMisconfigurationAdvisor.DescribeWarnings(configuration, envName);

        if (hints.Count == 0)
            return;

        Console.WriteLine();
        Console.WriteLine("--- Hosting misconfiguration hints (local env; mirrors ArchLucid.Api startup warnings) ---");
        Console.WriteLine(
            "Derived from this shell's environment variables — align with the API process/container. "
            + "See docs/engineering/BUILD.md (Hosting misconfiguration warnings).");

        foreach (string hint in hints)
            Console.WriteLine($" • {hint}");

        Console.WriteLine();
    }
}
