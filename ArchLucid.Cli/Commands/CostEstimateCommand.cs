using System.Text.Json;

using ArchLucid.Core.Costing;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     <c>archlucid cost-estimate [--live-pricing] &lt;manifest.json|extractor.zip&gt;</c>
/// </summary>
internal static partial class CostEstimateCommand
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
}
