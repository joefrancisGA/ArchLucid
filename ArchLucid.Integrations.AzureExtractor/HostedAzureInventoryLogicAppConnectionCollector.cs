using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects Logic App connection references for hosted Tier 2 packages (AX-DE-12).
/// </summary>
public static class HostedAzureInventoryLogicAppConnectionCollector
{
    private const string LogicAppApiVersion = "2019-05-01";

    public static async Task<HostedAzureInventoryLogicAppConnectionCollectResult> CollectAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<AzureInventoryLogicAppConnectionRow> rows = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);
        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Logic/workflows", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    JsonElement? workflowResource = await armReadClient.TryGetArmResourceJsonAsync(
                        accessToken,
                        resource.ResourceId.Trim(),
                        LogicAppApiVersion,
                        cancellationToken).ConfigureAwait(false);

                    if (workflowResource is not null)
                    {
                        foreach (AzureInventoryLogicAppConnectionRow connection in AzureInventoryLogicAppConnectionExtractor
                                     .ExtractFromWorkflow(
                                         resource.ResourceId.Trim(),
                                         resource.Name,
                                         workflowResource.Value))
                        {
                            AddConnection(connection, rows, seenKeys);
                        }
                    }
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    if (logger.IsEnabled(LogLevel.Debug))
                    {
                        logger.LogDebug(
                            ex,
                            "Hosted Azure extractor skipped Logic App workflow {WorkflowId}.",
                            resource.ResourceId);
                    }
                }

                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
                && resource.Properties.TryGetValue("kind", out object? kindValue)
                && $"{kindValue}".Contains("workflowapp", StringComparison.OrdinalIgnoreCase))
            {
                if (resource.Properties.TryGetValue("parameters.$connections.value", out object? connectionsValue))
                {
                    foreach (AzureInventoryLogicAppConnectionRow connection in
                             AzureInventoryLogicAppConnectionExtractor.ExtractFromStoredConnectionParameters(
                                 resource.ResourceId.Trim(),
                                 resource.Name,
                                 connectionsValue?.ToString() ?? string.Empty))
                    {
                        AddConnection(connection, rows, seenKeys);
                    }
                }
            }
        }

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Equals("Microsoft.Web/connections", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            try
            {
                JsonElement? connectionResource = await armReadClient.TryGetArmResourceJsonAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    LogicAppApiVersion,
                    cancellationToken).ConfigureAwait(false);

                AzureInventoryLogicAppConnectionRow? connection = connectionResource is null
                    ? null
                    : AzureInventoryLogicAppConnectionExtractor.ExtractFromWebConnection(connectionResource.Value);

                if (connection is not null)
                {
                    AddConnection(connection, rows, seenKeys);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped web connection {ConnectionId}.",
                        resource.ResourceId);
                }
            }
        }

        return new HostedAzureInventoryLogicAppConnectionCollectResult
        {
            Connections = rows,
        };
    }

    private static void AddConnection(
        AzureInventoryLogicAppConnectionRow connection,
        List<AzureInventoryLogicAppConnectionRow> rows,
        HashSet<string> seenKeys)
    {
        string key = $"{connection.WorkflowResourceId}|{connection.ConnectionName}|{connection.ConnectionResourceId}";

        if (seenKeys.Add(key))
        {
            rows.Add(connection);
        }
    }
}

public sealed class HostedAzureInventoryLogicAppConnectionCollectResult
{
    public IReadOnlyList<AzureInventoryLogicAppConnectionRow> Connections
    {
        get;
        init;
    } = [];

}
