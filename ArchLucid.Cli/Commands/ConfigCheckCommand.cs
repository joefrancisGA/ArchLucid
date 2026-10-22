using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Configuration.Summary;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Commands;

[ExcludeFromCodeCoverage(Justification = "Thin I/O; Core + tests cover logic.")]
internal static partial class ConfigCheckCommand
{
    public static async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        bool noApi = args.Any(a => string.Equals(a, "--no-api", StringComparison.Ordinal));
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();
        IConfiguration local = BuildLocalConfiguration(cli);
        string? envName =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");
        IReadOnlyDictionary<string, bool>? apiMap;
        string? apiNote;
        if (noApi)
        {
            apiMap = null;
            apiNote = "Note: --no-api — only local file + environment (no server snapshot).";
        }
        else
        {
            (apiMap, apiNote) = await TryFetchApiSummaryAsync(cli, cancellationToken).ConfigureAwait(false);
        }

        IReadOnlyList<ConfigurationKeyEntry> allKeys = ConfigurationKeyCatalog.All
            .Concat(ConfigurationKeyCatalog.CliLocalOnly)
            .ToList();
        HashSet<string> cliOnly = new(
            ConfigurationKeyCatalog.CliLocalOnly
                .Select(s => s.ConfigPath), StringComparer.OrdinalIgnoreCase);
        int requiredTotal = 0;
        int requiredSatisfied = 0;
        int optionalTotal = 0;
        int optionalSet = 0;
        List<ConfigCheckLine> lines = new(allKeys.Count + 1);
        foreach (ConfigurationKeyEntry e in allKeys)
        {
            (bool fromApi, bool fromLocal) = SplitPresence(
                e.ConfigPath,
                local,
                apiMap,
                cliOnly);
            bool isSet = fromApi || fromLocal;
            string source = FormatSource(fromApi, fromLocal);
            bool isRequired = ConfigurationKeyRequirement.IsKeyRequired(e, local, envName, out _);
            if (isRequired)
            {
                requiredTotal++;
                if (isSet)
                {
                    requiredSatisfied++;
                }
            }
            else
            {
                optionalTotal++;
                if (isSet)
                {
                    optionalSet++;
                }
            }

            lines.Add(new ConfigCheckLine(e.ConfigPath, isSet, source, isRequired, e.Description));
        }

        bool pairFailed = false;
        if (local.GetValue("Authentication:ApiKey:Enabled", false))
        {
            bool hAdmin = ConfigurationKeyPresence.IsValuePresent(local, "Authentication:ApiKey:AdminKey");
            bool hRead = ConfigurationKeyPresence.IsValuePresent(local, "Authentication:ApiKey:ReadOnlyKey");
            if (!hAdmin && !hRead)
            {
                pairFailed = true;
                requiredTotal++;
                lines.Add(
                    new ConfigCheckLine(
                        "ApiKey(Admin|Read) pair",
                        false,
                        "required-rule",
                        true,
                        "At least one of Authentication:ApiKey:AdminKey or ReadOnlyKey when API key mode is on."));
            }
        }

        int anyMissing = 0;
        foreach (ConfigCheckLine c in lines)
        {
            if (c is { IsRequired: true, IsSet: false })
            {
                anyMissing++;
            }
        }

        bool ok = anyMissing == 0 && !pairFailed;
        WriteReport(
            ok,
            apiMap is not null,
            apiNote,
            requiredSatisfied,
            requiredTotal,
            optionalSet,
            optionalTotal,
            lines,
            pairFailed);

        return ok ? CliExitCode.Success : CliExitCode.OperationFailed;
    }
}
