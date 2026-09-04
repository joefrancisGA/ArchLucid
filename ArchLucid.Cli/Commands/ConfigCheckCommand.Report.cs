using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Cli.Commands;

internal static partial class ConfigCheckCommand
{
    private static void WriteReport(
        bool ok,
        bool hasApiKeySnapshot,
        string? apiNote,
        int requiredSatisfied,
        int requiredTotal,
        int optionalSet,
        int optionalTotal,
        List<ConfigCheckLine> lines,
        bool pairFailed)
    {
        if (CliExecutionContext.JsonOutput)
        {
            var payload = new
            {
                ok,
                hasApiKeySnapshot,
                note = apiNote,
                summary = new { requiredSatisfied, requiredTotal, optionalSet, optionalTotal },
                keys = lines
                    .Select(c => new
                    {
                        configPath = c.ConfigPath,
                        c.IsSet,
                        c.Source,
                        c.IsRequired,
                        c.Notes
                    })
                    .ToList()
            };
            Console.WriteLine(JsonSerializer.Serialize(payload, ContractJson.CamelCaseIgnoreNullIndented));
        }
        else
        {
            if (apiNote is not null)
            {
                Console.WriteLine(apiNote);
                Console.WriteLine();
            }

            foreach (ConfigCheckLine c in lines)
            {
                string m = c.IsSet ? "SET" : "MISSING";
                Console.WriteLine(
                    $"{c.ConfigPath,-60} {m,-8} {c.Source,-16} {(c.IsRequired ? "req" : "opt")} {c.Notes}");
            }

            Console.WriteLine();
            Console.WriteLine(
                $"Required satisfied: {requiredSatisfied}/{requiredTotal} · optional set: {optionalSet}/{optionalTotal} (optional do not fail the command).");
            if (pairFailed)
                Console.Error.WriteLine(
                    "API key key material: set AdminKey and/or ReadOnlyKey when `Authentication:ApiKey:Enabled` is true.");
        }
    }
}
