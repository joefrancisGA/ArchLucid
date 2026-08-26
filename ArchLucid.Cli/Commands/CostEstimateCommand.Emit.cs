using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Costing;

using Spectre.Console;

namespace ArchLucid.Cli.Commands;

internal static partial class CostEstimateCommand
{
    private static void EmitResults(string inputPath, string systemName, InfrastructureCostEstimateTotals totals,
        string inputKind)
    {
        if (CliExecutionContext.JsonOutput)
        {
            EmitJson(inputPath,
                systemName,
                totals,
                inputKind);
            return;
        }

        RenderTable(inputPath,
            systemName,
            totals,
            inputKind);
    }

    private static void RenderTable(string inputPath, string systemName, InfrastructureCostEstimateTotals totals,
        string inputKind)
    {
        string banner = totals.AllRetailPricing
            ?
            "[gray]Monthly infrastructure estimates (USD) — all rows matched Azure Retail consumption meters.[/]"
            :
            totals.AnyRetailPricing
                ?
                "[gray]Blend of Azure Retail Prices API matches and illustrative fallbacks (730h/month where hourly).[/]"
                :
                "[gray]Illustrative infrastructure USD/month — add --live-pricing for Retail API attempts.[/]";

        AnsiConsole.MarkupLine(banner);
        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine($"[bold]Input:[/] {Markup.Escape(inputPath)}");
        AnsiConsole.MarkupLine($"[bold]Kind:[/] {Markup.Escape(inputKind)}");
        AnsiConsole.MarkupLine($"[bold]System:[/] {Markup.Escape(systemName)}");
        AnsiConsole.WriteLine();

        Table table = new Table().Border(TableBorder.Rounded);
        table.AddColumn("Kind");
        table.AddColumn("Name");
        table.AddColumn("Azure product");
        table.AddColumn(new TableColumn("Est. USD/mo").RightAligned());
        table.AddColumn("Source");

        CultureInfo us = CultureInfo.GetCultureInfo("en-US");

        foreach (InfrastructureCostLine row in totals.Lines)
        {
            table.AddRow(
                Markup.Escape(row.LineKind),
                Markup.Escape(row.DisplayName),
                Markup.Escape(row.AzureProductLabel),
                row.EstimatedUsdPerMonth.ToString("C0", us),
                Markup.Escape(FormatPriceSource(row.PriceSource)));
        }

        if (totals.Lines.Count == 0)
        {
            table.AddRow("[gray]—[/]", "[gray]No billable rows[/]", "[gray]—[/]", "[gray]$0[/]", "[gray]—[/]");
        }

        AnsiConsole.Write(table);
        AnsiConsole.WriteLine();
        AnsiConsole.MarkupLine(
            $"[bold]Total:[/] {totals.TotalUsdPerMonth.ToString("C0", us)} / month");
    }

    private static string FormatPriceSource(InfrastructureCostPriceSource source)
        =>
            source switch
            {
                InfrastructureCostPriceSource.RetailApi =>
                    "retail_api",
                InfrastructureCostPriceSource.Estimated =>
                    "estimated",
                _
                    =>
                        "unknown",
            };

    private static void EmitJson(string inputPath,
        string systemName,
        InfrastructureCostEstimateTotals totals,
        string inputKind)
    {
        string disclaimer = totals.AllRetailPricing
            ?
            "All rows resolved via Azure Retail Prices API assumptions."
            :
            totals.AnyRetailPricing
                ?
                "Blend of Azure Retail Prices API and illustrative sizing."
                :
                "Illustrative sizing only (--live-pricing disables this mode for SKUs/regions wired in manifests).";

        object payload = new
        {
            ok = true,
            inputPath,
            inputKind,
            systemName,
            disclaimer,
            pricingMode = totals.AnyRetailPricing ? "retail_blend" : "illustrative",
            currency = "USD",
            interval = "monthly",
            totalUsdPerMonth = totals.TotalUsdPerMonth,
            lineItems =
                totals.Lines
                    .
                    Select(
                        row =>
                            new
                            {
                                kind = row.LineKind,
                                name = row.DisplayName,
                                runtimePlatform = row.Platform.ToString(),
                                azureProduct = row.AzureProductLabel,
                                estimatedUsdPerMonth = row.EstimatedUsdPerMonth,
                                priceSource = FormatPriceSource(row.PriceSource),
                            })
                    .
                    ToArray(),
        };

        Console.WriteLine(JsonSerializer.Serialize(payload, JsonOut));
    }

    private static void EmitUsage(string? parseError)
    {
        const string usage = "Usage: archlucid cost-estimate [--live-pricing] <manifest.json|extractor.zip>";

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
}
