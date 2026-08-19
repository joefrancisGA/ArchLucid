namespace ArchLucid.Cli.Commands;

internal sealed record ShipGateUiBaseUrlResolution(string? BaseUrl, string Source)
{
    internal const string SkippedSource = "skipped";

    internal const string ExplicitArgSource = "explicit-arg";

    internal const string EnvironmentSource = "environment";

    internal const string ConfigSource = "archlucid.json";

    internal const string UnconfiguredSource = "unconfigured";
}

internal static class ShipGateUiBaseUrlResolver
{
    internal static ShipGateUiBaseUrlResolution Resolve(
        IReadOnlyList<string> args,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config)
    {
        ArgumentNullException.ThrowIfNull(args);

        if (HasFlag(args, "--skip-ui-route-smoke"))
        {
            return new ShipGateUiBaseUrlResolution(null, ShipGateUiBaseUrlResolution.SkippedSource);
        }

        string? fromArg = CliCommandShared.TryGetOptionValue(args, "--ui-base-url");

        if (!string.IsNullOrWhiteSpace(fromArg))
        {
            return new ShipGateUiBaseUrlResolution(
                fromArg.Trim().TrimEnd('/'),
                ShipGateUiBaseUrlResolution.ExplicitArgSource);
        }

        string? fromEnv = Environment.GetEnvironmentVariable("ARCHLUCID_UI_BASE_URL");

        if (!string.IsNullOrWhiteSpace(fromEnv))
        {
            return new ShipGateUiBaseUrlResolution(
                fromEnv.Trim().TrimEnd('/'),
                ShipGateUiBaseUrlResolution.EnvironmentSource);
        }

        if (!string.IsNullOrWhiteSpace(config?.UiUrl))
        {
            return new ShipGateUiBaseUrlResolution(
                config.UiUrl.Trim().TrimEnd('/'),
                ShipGateUiBaseUrlResolution.ConfigSource);
        }

        return new ShipGateUiBaseUrlResolution(null, ShipGateUiBaseUrlResolution.UnconfiguredSource);
    }

    private static bool HasFlag(IReadOnlyList<string> args, string flagName)
    {
        return args.Any(arg => string.Equals(arg, flagName, StringComparison.OrdinalIgnoreCase));
    }
}
