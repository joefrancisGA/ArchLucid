using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects optional NIC effective NSG and route table evidence (IE-RF-10).
/// </summary>
public static class HostedAzureEffectiveNetworkControlCollector
{
    public const int MaxNicCount = 200;

    public static async Task<HostedAzureEffectiveNetworkControlCollectResult> CollectAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<string> nicResourceIds = resources
            .Where(resource => resource.ResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
            .Select(resource => resource.ResourceId.Trim())
            .Where(resourceId => !string.IsNullOrWhiteSpace(resourceId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(resourceId => resourceId, StringComparer.Ordinal)
            .ToList();

        List<string> warnings = [];
        bool capped = false;

        if (nicResourceIds.Count > MaxNicCount)
        {
            capped = true;
            warnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.EffectiveControlsCapped);
            nicResourceIds = nicResourceIds.Take(MaxNicCount).ToList();

            if (logger.IsEnabled(LogLevel.Information))
            {
                logger.LogInformation(
                    "Hosted Azure extractor capped effective network control collection at {MaxNicCount} NICs.",
                    MaxNicCount);
            }
        }

        List<HostedAzureArmEffectiveNetworkControlRecord> rows = [];

        foreach (string nicResourceId in nicResourceIds)
        {
            cancellationToken.ThrowIfCancellationRequested();

            IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord> nicRows = await armReadClient
                .ListEffectiveNetworkControlsForNicAsync(accessToken, nicResourceId, cancellationToken)
                .ConfigureAwait(false);

            rows.AddRange(nicRows);
        }

        return new HostedAzureEffectiveNetworkControlCollectResult
        {
            Rows = rows,
            Warnings = warnings,
            Capped = capped,
        };
    }
}

public sealed class HostedAzureEffectiveNetworkControlCollectResult
{
    public IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord> Rows
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> Warnings
    {
        get;
        init;
    } = [];

    public bool Capped
    {
        get;
        init;
    }
}
