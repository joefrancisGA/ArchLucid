using System.Text.Json;

using ArchLucid.Contracts.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AzureExtractor;

/// <inheritdoc cref="IAzureExtractorResultEnricher" />
public sealed class AzureExtractorResultEnricher(
    IAgentCompletionClient completionClient,
    IOptions<AzureExtractorEnrichmentOptions> options,
    ILogger<AzureExtractorResultEnricher> logger) : IAzureExtractorResultEnricher
{
    private const string SystemPrompt =
        "You infer missing Azure ARM metadata from resource names. Return ONLY valid JSON with keys: " +
        "resourceType (string), location (string), tier (string), inferred (boolean). " +
        "Use empty string for fields you cannot infer. Set inferred true when any field was guessed.";

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IAgentCompletionClient _completionClient =
        completionClient ?? throw new ArgumentNullException(nameof(completionClient));

    private readonly AzureExtractorEnrichmentOptions _options =
        (options ?? throw new ArgumentNullException(nameof(options))).Value;

    private readonly ILogger<AzureExtractorResultEnricher> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<IReadOnlyList<EnrichedAzureExtractorInventoryLine>> EnrichAsync(
        IReadOnlyList<AzureExtractorInventoryResourceLine> lines,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(lines);

        if (!_options.Enabled || lines.Count == 0)
            return lines.Select(ToPassthroughLine).ToList();

        List<EnrichedAzureExtractorInventoryLine> enriched = [];

        foreach (AzureExtractorInventoryResourceLine line in lines)
        {
            EnrichedAzureExtractorInventoryLine mapped = ToPassthroughLine(line);

            if (!NeedsEnrichment(line))
            {
                enriched.Add(mapped);

                continue;
            }

            (string resourceGroup, string shortName) = ParseResourceGroupAndName(line.Name);

            mapped.ResourceGroup = resourceGroup;

            EnrichedAzureExtractorInventoryLine? inferred =
                await TryInferAsync(shortName, resourceGroup, line, cancellationToken).ConfigureAwait(false);

            enriched.Add(inferred ?? mapped);
        }

        return enriched;
    }

    private static bool NeedsEnrichment(AzureExtractorInventoryResourceLine line)
    {
        return string.IsNullOrWhiteSpace(line.ResourceType)
               || string.IsNullOrWhiteSpace(line.Location)
               || string.IsNullOrWhiteSpace(line.SkuName);
    }

    private static EnrichedAzureExtractorInventoryLine ToPassthroughLine(AzureExtractorInventoryResourceLine line)
    {
        (string resourceGroup, string shortName) = ParseResourceGroupAndName(line.Name);

        return new EnrichedAzureExtractorInventoryLine
        {
            Name = shortName,
            ResourceGroup = resourceGroup,
            ResourceType = line.ResourceType,
            Location = line.Location,
            Tier = line.SkuName,
            ResourceTypeInferred = false,
            LocationInferred = false,
            TierInferred = false,
        };
    }

    private async Task<EnrichedAzureExtractorInventoryLine?> TryInferAsync(
        string shortName,
        string resourceGroup,
        AzureExtractorInventoryResourceLine line,
        CancellationToken cancellationToken)
    {
        string userPrompt =
            $"Given this Azure resource name '{shortName}' in resource group '{resourceGroup}', " +
            $"infer the most likely ResourceType, Location, and SKU/Tier. " +
            $"Known partial data: resourceType='{line.ResourceType}', location='{line.Location}', tier='{line.SkuName}'.";

        try
        {
            string rawJson = await _completionClient
                .CompleteJsonAsync(SystemPrompt, userPrompt, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            InferencePayload? payload = JsonSerializer.Deserialize<InferencePayload>(rawJson, JsonOptions);

            if (payload is null)
                return null;

            EnrichedAzureExtractorInventoryLine result = ToPassthroughLine(line);

            if (string.IsNullOrWhiteSpace(result.ResourceType) && !string.IsNullOrWhiteSpace(payload.ResourceType))
            {
                result.ResourceType = payload.ResourceType.Trim();
                result.ResourceTypeInferred = true;
            }

            if (string.IsNullOrWhiteSpace(result.Location) && !string.IsNullOrWhiteSpace(payload.Location))
            {
                result.Location = payload.Location.Trim();
                result.LocationInferred = true;
            }

            if (string.IsNullOrWhiteSpace(result.Tier) && !string.IsNullOrWhiteSpace(payload.Tier))
            {
                result.Tier = payload.Tier.Trim();
                result.TierInferred = true;
            }

            if (payload.Inferred && !result.ResourceTypeInferred && !result.LocationInferred && !result.TierInferred)
            {
                // Model signalled inference without filling fields we could apply — leave passthrough flags.
            }

            return result;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(
                ex,
                "Azure extractor inventory enrichment failed for resource {ResourceName}.",
                LogSanitizer.Sanitize(shortName));

            return null;
        }
    }

    internal static (string ResourceGroup, string ShortName) ParseResourceGroupAndName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return (string.Empty, string.Empty);

        ReadOnlySpan<char> span = name.AsSpan().Trim();

        const string rgMarker = "/resourceGroups/";

        int rgIndex = span.IndexOf(rgMarker, StringComparison.OrdinalIgnoreCase);

        if (rgIndex < 0)
            return (string.Empty, name.Trim());

        ReadOnlySpan<char> afterRg = span[(rgIndex + rgMarker.Length)..];
        int slash = afterRg.IndexOf('/');

        string resourceGroup = slash < 0
            ? afterRg.ToString()
            : afterRg[..slash].ToString();

        int providersIndex = span.LastIndexOf("/providers/", StringComparison.OrdinalIgnoreCase);

        string shortName = providersIndex < 0
            ? name.Trim()
            : span[(providersIndex + "/providers/".Length)..].ToString();

        int typeSlash = shortName.LastIndexOf('/');

        if (typeSlash >= 0 && typeSlash < shortName.Length - 1)
            shortName = shortName[(typeSlash + 1)..];

        return (resourceGroup, shortName);
    }

    private sealed class InferencePayload
    {
        public string? ResourceType
        {
            get;
            set;
        }

        public string? Location
        {
            get;
            set;
        }

        public string? Tier
        {
            get;
            set;
        }

        public bool Inferred
        {
            get;
            set;
        }
    }
}
