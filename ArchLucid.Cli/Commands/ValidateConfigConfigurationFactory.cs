using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

internal static class ValidateConfigConfigurationFactory
{
    internal static bool AppsettingsFileExists(string contentRoot)
    {
        ArgumentException.ThrowIfNullOrEmpty(contentRoot);

        return File.Exists(Path.Combine(contentRoot, "appsettings.json"));
    }

    /// <summary>
    ///     Merges JSON files (including environment-specific overlay), CLI overlays, then environment variables — last wins.
    /// </summary>
    /// <param name="cli">Optional CLI manifest used for overlays (API URL).</param>
    /// <param name="contentRoot">
    ///     Directory containing <c>archlucid.json</c> / <c>appsettings*.json</c> for merges; defaults to
    ///     <see cref="Directory.GetCurrentDirectory" /> when null or whitespace.
    /// </param>
    internal static IConfiguration BuildMerged(ArchLucidProjectScaffolder.ArchLucidCliConfig? cli, string? contentRoot = null)
    {
        List<KeyValuePair<string, string?>> overlays = new(2);

        if (cli is not null && !string.IsNullOrWhiteSpace(cli.ApiUrl))

            overlays.Add(new KeyValuePair<string, string?>(
                "ARCHLUCID_API_URL",
                cli.ApiUrl.Trim().TrimEnd('/')));

        string root = string.IsNullOrWhiteSpace(contentRoot)
            ? Directory.GetCurrentDirectory()
            : Path.GetFullPath(contentRoot);

        // Bootstrap ASP.NET environment name so appsettings.{env}.json participates like the API host.
        IConfiguration bootstrap = new ConfigurationBuilder()
            .SetBasePath(root)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();

        string hostingEnvironment =
            bootstrap["ASPNETCORE_ENVIRONMENT"]?.Trim()
            ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Production";

        string envJsonPath = $"appsettings.{hostingEnvironment}.json";

        return new ConfigurationBuilder()
            .SetBasePath(root)
            .AddJsonFile("archlucid.json", optional: true, reloadOnChange: false)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile(envJsonPath, optional: true, reloadOnChange: false)
            .AddInMemoryCollection(overlays)
            .AddEnvironmentVariables()
            .Build();
    }
}
