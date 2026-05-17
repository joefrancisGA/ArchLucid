using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Http;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using Microsoft.Extensions.Http.Polly;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;


using Spectre.Console;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid cost-estimate [--live-pricing] &lt;manifest.json|extractor.zip&gt;</c>
/// </summary>
internal static class CostEstimateCommand

{
    private static readonly JsonSerializerOptions ManifestReadJson = CreateManifestReadJson();


    private static readonly JsonSerializerOptions JsonOut =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private const int FailureExitCode = CliExitCode.UsageError;


    internal static async Task<int> RunAsync(string[] args)

    {

        if (!TryParseArgs(args, out bool livePricing, out string? path, out string? parseError))


        {


            EmitUsage(parseError);



            return FailureExitCode;

        }



        string absolutePath = Path.GetFullPath(path!.Trim());


        if (!File.Exists(absolutePath))


        {


            EmitFileError($"File not found: {absolutePath}");

            return FailureExitCode;

        }



        return string.Equals(Path.GetExtension(absolutePath), ".zip", StringComparison.OrdinalIgnoreCase)

            ? await RunExtractorZipAsync(absolutePath, livePricing).ConfigureAwait(false)

            : await RunGoldenManifestAsync(absolutePath, livePricing).ConfigureAwait(false);

    }



    private static async Task<int> RunGoldenManifestAsync(string absolutePath, bool livePricing)

    {


        GoldenManifest? manifest;


        try

        {


            string json = await File.ReadAllTextAsync(absolutePath).ConfigureAwait(false);

            manifest = JsonSerializer.Deserialize<GoldenManifest>(json, ManifestReadJson);

        }

        catch (JsonException ex)

        {


            EmitFileError($"Invalid JSON: {ex.Message}");

            return FailureExitCode;

        }



        if (manifest is null)


        {


            EmitFileError("Manifest deserialized to null.");

            return FailureExitCode;

        }



        List<InfrastructureCostQueryNode> nodes =
            ManifestInfrastructureCostNodes.FromGoldenTopology(manifest.Services,

                manifest.Datastores);



        InfrastructureCostEstimateTotals totals = await EstimateAsync(nodes,

            livePricing).ConfigureAwait(false);

        EmitResults(absolutePath,

            manifest.SystemName,
            totals,
            inputKind: "GoldenManifest");


        return CliExitCode.Success;

    }



    private static async Task<int> RunExtractorZipAsync(string absolutePath, bool livePricing)


    {


        await using FileStream zipStream = new(absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read);

        (IReadOnlyList<AzureExtractorInventoryResourceLine>? lines,

            string?

            inventoryError)

            = AzureExtractorResourceInventoryReader.TryReadFromZip(zipStream);


        if (inventoryError is not null)


        {


            EmitFileError(inventoryError);

            return FailureExitCode;

        }


        lines ??=

            [];

        List<InfrastructureCostQueryNode> nodes = ManifestInfrastructureCostNodes.FromExtractorInventory(lines);


        InfrastructureCostEstimateTotals totals = await EstimateAsync(nodes,


                livePricing)
            .

            ConfigureAwait(false);

        EmitResults(absolutePath,

            ZipStyleSystemName(lines.Count),

            totals,

            inputKind: "ExtractorZip");


        return CliExitCode.Success;

    }



    private static string ZipStyleSystemName(int resourceRows)
        =>
            $"Azure extractor inventory ({resourceRows} mapped resources)";



    private static async Task<InfrastructureCostEstimateTotals> EstimateAsync(List<InfrastructureCostQueryNode> nodes,
        bool livePricing)

    {


        if (!livePricing)

        {


            InfrastructureMonthlyUsdCostEstimator offline = new(NullLogger.Instance);

            return await offline.EstimateNodesAsync(nodes,

                attemptRetailPricing: false,
                retailPrices: null,
                CancellationToken.None).ConfigureAwait(false);

        }


        HttpClient handlerBacked = BuildRetailHttpClient();

        try


        {


            Func<HttpClient> factory = () => handlerBacked;

            AzureRetailPricesCatalogClient catalog =
                new(factory,
                    TimeProvider.System,

                    NullLogger<AzureRetailPricesCatalogClient>.Instance);

            InfrastructureMonthlyUsdCostEstimator online = new(NullLogger.Instance);



            return await online.EstimateNodesAsync(nodes,
                attemptRetailPricing: true,

                catalog,

                CancellationToken.None).ConfigureAwait(false);

        }


        finally


        {


            handlerBacked.Dispose();

        }



    }



    private static HttpClient BuildRetailHttpClient()

    {


        ILogger logger = NullLoggerFactory.Instance.CreateLogger("ArchLucid.Cli.AzureRetail");

        PolicyHttpMessageHandler retry = new(AzureRmAndRetailPricesHttpRetryPolicy.Create(logger))

        {


            InnerHandler = new HttpClientHandler(),

        };


        return new HttpClient(retry)

        {


            BaseAddress = ArchLucidAzurePublicHttpClients.RetailPricesAuthority,
            Timeout = TimeSpan.FromSeconds(40),
        };

    }



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

            "[grey]Monthly infrastructure estimates (USD) — all rows matched Azure Retail consumption meters.[/]"

            :

            totals.AnyRetailPricing

                ?

                "[grey]Blend of Azure Retail Prices API matches and illustrative fallbacks (730h/month where hourly).[/]"

                :

                "[grey]Illustrative infrastructure USD/month — add --live-pricing for Retail API attempts.[/]";

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


            table.AddRow("[grey]—[/]", "[grey]No billable rows[/]", "[grey]—[/]", "[grey]$0[/]", "[grey]—[/]");

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



    private static bool TryParseArgs(string[] args, out bool livePricing, [NotNullWhen(true)] out string? path,
        out string? error)


    {


        livePricing = false;


        path = null;

        error = null;

        string? resolvedPath = null;


        foreach (string argRaw in args)

        {


            string arg =
                argRaw.Trim();


            if (string.IsNullOrWhiteSpace(arg))
                continue;

            if (string.Equals("--live-pricing",

                    arg,
                    StringComparison.OrdinalIgnoreCase))


            {


                livePricing =
                    true;


                continue;

            }



            if (arg.StartsWith('-'))


            {


                error = $"Unexpected argument '{arg}'.";

                return false;

            }



            if (resolvedPath is not null)


            {


                error = "Only one input path may be specified.";

                return false;


            }



            resolvedPath = arg.Trim();

        }


        if (resolvedPath is null)


        {


            error = "Missing input file path.";


            return false;

        }



        path = resolvedPath;



        return true;

    }



}
