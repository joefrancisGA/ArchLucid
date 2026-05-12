using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using Spectre.Console;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid cost-estimate &lt;manifest.json&gt;</c> — reads a golden manifest and prints a mock monthly cost table.
/// </summary>
internal static class CostEstimateCommand
{
    private static readonly JsonSerializerOptions ManifestReadJson = CreateManifestReadJson();

    private static readonly JsonSerializerOptions JsonOut =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private const int FailureExitCode = CliExitCode.UsageError;

    internal static Task<int> RunAsync(string[] args)
    {
        if (!TryResolveManifestPath(args, out string? path, out string? parseError))
        {
            EmitUsage(parseError);

            return Task.FromResult(FailureExitCode);
        }

        if (string.IsNullOrWhiteSpace(path))
        {
            EmitUsage("Manifest path is empty.");

            return Task.FromResult(FailureExitCode);
        }

        string absolutePath = Path.GetFullPath(path.Trim());

        if (!File.Exists(absolutePath))
        {
            EmitFileError($"File not found: {absolutePath}");

            return Task.FromResult(FailureExitCode);
        }

        GoldenManifest? manifest;

        try
        {
            string json = File.ReadAllText(absolutePath);
            manifest = JsonSerializer.Deserialize<GoldenManifest>(json, ManifestReadJson);
        }
        catch (JsonException ex)
        {
            EmitFileError($"Invalid JSON: {ex.Message}");

            return Task.FromResult(FailureExitCode);
        }

        if (manifest is null)
        {
            EmitFileError("Manifest deserialized to null.");

            return Task.FromResult(FailureExitCode);
        }

        List<CostRow> rows = BuildRows(manifest);

        if (CliExecutionContext.JsonOutput)
        {
            EmitJson(absolutePath, manifest.SystemName, rows);

            return Task.FromResult(CliExitCode.Success);
        }

        RenderTable(absolutePath, manifest.SystemName, rows);

        return Task.FromResult(CliExitCode.Success);
    }

    private static List<CostRow> BuildRows(GoldenManifest manifest)
    {
        List<CostRow> rows = [];

        if (manifest.Services is not null)
        {
            foreach (ManifestService svc in manifest.Services)
            {

                if (svc is null)
                    continue;

                string name = string.IsNullOrWhiteSpace(svc.ServiceName) ? "(unnamed service)" : svc.ServiceName;
                decimal usd = MockAzureMonthlyCostEstimator.EstimateUsdPerMonth(svc.RuntimePlatform);

                rows.Add(new CostRow("Service", name, svc.RuntimePlatform, usd));
            }
        }

        if (manifest.Datastores is not null)
        {
            foreach (ManifestDatastore ds in manifest.Datastores)
            {

                if (ds is null)
                    continue;

                string name = string.IsNullOrWhiteSpace(ds.DatastoreName) ? "(unnamed datastore)" : ds.DatastoreName;
                decimal usd = MockAzureMonthlyCostEstimator.EstimateUsdPerMonth(ds.RuntimePlatform);

                rows.Add(new CostRow("Datastore", name, ds.RuntimePlatform, usd));
            }
        }

        return rows;
    }

    private static void RenderTable(string manifestPath, string systemName, List<CostRow> rows)
    {
        AnsiConsole.MarkupLine("[grey]Illustrative mock costs (USD/month) — not from Azure Pricing API.[/]");
        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine($"[bold]Manifest:[/] {Markup.Escape(manifestPath)}");
        AnsiConsole.MarkupLine($"[bold]System:[/] {Markup.Escape(systemName)}");
        AnsiConsole.WriteLine();

        Table table = new Table().Border(TableBorder.Rounded);
        table.AddColumn("Kind");
        table.AddColumn("Name");
        table.AddColumn("Azure product (mock)");
        table.AddColumn(new TableColumn("Est. USD/mo").RightAligned());

        CultureInfo us = CultureInfo.GetCultureInfo("en-US");
        decimal total = 0m;

        foreach (CostRow row in rows)
        {
            total += row.EstimatedUsdPerMonth;
            string azureProductLabel = MockAzureMonthlyCostEstimator.FormatIllustrativeAzureProduct(row.RuntimePlatform);

            table.AddRow(
                Markup.Escape(row.Kind),
                Markup.Escape(row.Name),
                Markup.Escape(azureProductLabel),
                row.EstimatedUsdPerMonth.ToString("C0", us));
        }

        if (rows.Count == 0)
        {
            table.AddRow("[grey]—[/]", "[grey]No services or datastores[/]", "[grey]—[/]", "[grey]$0[/]");
        }

        AnsiConsole.Write(table);
        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine($"[bold]Total (mock):[/] {total.ToString("C0", us)} / month");
    }

    private static void EmitJson(string manifestPath, string systemName, List<CostRow> rows)
    {
        decimal total = rows.Sum(static r => r.EstimatedUsdPerMonth);

        object payload = new
        {
            ok = true,
            manifest = manifestPath,
            systemName,
            disclaimer = "Illustrative mock costs — not from Azure Pricing API.",
            currency = "USD",
            interval = "monthly",
            totalUsdPerMonth = total,
            lineItems = rows
                .Select(
                    r => new
                    {
                        kind = r.Kind,
                        name = r.Name,
                        runtimePlatform = r.RuntimePlatform.ToString(),
                        azureProduct = MockAzureMonthlyCostEstimator.FormatIllustrativeAzureProduct(r.RuntimePlatform),
                        estimatedUsdPerMonth = r.EstimatedUsdPerMonth,
                    })
                .ToArray(),
        };

        Console.WriteLine(JsonSerializer.Serialize(payload, JsonOut));
    }

    private static void EmitUsage(string? parseError)
    {
        const string usage = "Usage: archlucid cost-estimate <manifest.json>";

        if (CliExecutionContext.JsonOutput)
        {
            string message = parseError is null ? usage : $"{usage} ({parseError})";

            CliJson.WriteFailureLine(Console.Error, FailureExitCode, "cost_estimate", message);

            return;
        }

        Console.Error.WriteLine(usage);

        if (parseError is not null)
            Console.Error.WriteLine(parseError);
    }

    private static void EmitFileError(string message)
    {
        if (CliExecutionContext.JsonOutput)
        {
            CliJson.WriteFailureLine(Console.Error, FailureExitCode, "cost_estimate", message);

            return;
        }

        Console.Error.WriteLine("[cost-estimate] " + message);
    }

    private static JsonSerializerOptions CreateManifestReadJson()
    {
        return new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true,
            Converters =
            {
                new JsonStringEnumConverter<ServiceType>(allowIntegerValues: true),
                new JsonStringEnumConverter<DatastoreType>(allowIntegerValues: true),
                new JsonStringEnumConverter<RuntimePlatform>(allowIntegerValues: true),
                new JsonStringEnumConverter<RelationshipType>(allowIntegerValues: true),
            },
        };
    }

    private static bool TryResolveManifestPath(string[] args, [NotNullWhen(true)] out string? path, out string? error)
    {
        path = null;
        error = null;
        string? resolved = null;

        foreach (string arg in args)
        {

            if (string.IsNullOrWhiteSpace(arg))
                continue;

            if (arg.StartsWith('-'))
            {
                error = $"Unexpected argument '{arg}'.";

                return false;
            }

            if (resolved is not null)
            {
                error = "Only one manifest path may be specified.";

                return false;
            }

            resolved = arg.Trim();
        }

        if (resolved is null)
        {
            error = "Missing manifest file path.";

            return false;
        }

        path = resolved;

        return true;
    }

    private readonly record struct CostRow(string Kind, string Name, RuntimePlatform RuntimePlatform, decimal EstimatedUsdPerMonth);
}
