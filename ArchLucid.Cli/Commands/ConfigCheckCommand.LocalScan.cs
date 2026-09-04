using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigCheckCommand
{
    private static IConfiguration BuildLocalConfiguration(ArchLucidProjectScaffolder.ArchLucidCliConfig? cli)
    {
        List<KeyValuePair<string, string?>> m = new(2);
        if (cli is not null && !string.IsNullOrWhiteSpace(cli.ApiUrl))
        {
            m.Add(
                new KeyValuePair<string, string?>("ARCHLUCID_API_URL", cli.ApiUrl.Trim().TrimEnd('/')));
        }

        IConfigurationBuilder b = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("archlucid.json", true, true)
            .AddJsonFile("appsettings.json", true, true)
            .AddInMemoryCollection(m)
            .AddEnvironmentVariables();

        return b.Build();
    }

    private static (bool fromApi, bool fromLocal) SplitPresence(
        string path,
        IConfiguration local,
        IReadOnlyDictionary<string, bool>? apiMap,
        HashSet<string> cliOnly)
    {
        bool fromApi = false;
        if (apiMap is not null
            && !cliOnly.Contains(path)
            && apiMap.TryGetValue(
                path, out bool a))
        {
            fromApi = a;
        }

        bool fromLocal;
        if (string.Equals(
                path, "ASPNETCORE_ENVIRONMENT", StringComparison.Ordinal) || string.Equals(
                path, "DOTNET_ENVIRONMENT", StringComparison.Ordinal)
           )
        {
            fromLocal = !string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
                ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT"));
        }
        else if (string.Equals(path, "ARCHLUCID_API_KEY", StringComparison.Ordinal))
        {
            fromLocal = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_API_KEY"));
        }
        else if (string.Equals(path, "ARCHLUCID_API_URL", StringComparison.Ordinal))
        {
            fromLocal = !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("ARCHLUCID_API_URL"))
                        || !string.IsNullOrWhiteSpace(local["ARCHLUCID_API_URL"]);
        }
        else
        {
            fromLocal = ConfigurationKeyPresence.IsValuePresent(local, path);
        }

        return (fromApi, fromLocal);
    }

    private static string FormatSource(bool fromApi, bool fromLocal)
    {
        if (fromApi && fromLocal)
        {
            return "api+local";
        }

        if (fromApi)
        {
            return "api";
        }

        return fromLocal ? "local" : "—";
    }
}
