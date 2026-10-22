using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Costing;
using ArchLucid.Core.Http;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using Polly;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Cli.Commands;

internal static partial class CostEstimateCommand
{
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
        AzureRetailPricesCliRetryHandler retry = new(logger) { InnerHandler = new HttpClientHandler() };
        return new HttpClient(retry)
        {
            BaseAddress = ArchLucidAzurePublicHttpClients.RetailPricesAuthority,
            Timeout = TimeSpan.FromSeconds(40),
        };
    }

    /// <remarks>
    ///     Uses shared Polly v8 bridging policy (<see cref="AzureRmAndRetailPricesHttpRetryPolicy"/>) without IHttpClientFactory.
    /// </remarks>
    private sealed class AzureRetailPricesCliRetryHandler : DelegatingHandler
    {
        private readonly IAsyncPolicy<HttpResponseMessage> _policy;

        public AzureRetailPricesCliRetryHandler(ILogger logger)
        {
            ArgumentNullException.ThrowIfNull(logger);
            _policy = AzureRmAndRetailPricesHttpRetryPolicy.Create(logger);
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
                CancellationToken cancellationToken)
            =>
                _policy.ExecuteAsync(ct => base.SendAsync(request, ct), cancellationToken);
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
