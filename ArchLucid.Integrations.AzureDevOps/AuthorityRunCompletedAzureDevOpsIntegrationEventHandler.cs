using System.Text.Json;

using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Integration;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Integrations.AzureDevOps;

/// <summary>
/// Consumes <see cref="IntegrationEventTypes.AuthorityRunCompletedV1"/> and optionally decorates a configured Azure DevOps PR.
/// </summary>
public sealed class AuthorityRunCompletedAzureDevOpsIntegrationEventHandler(
    IAzureDevOpsPullRequestDecorator decorator,
    IOptions<AzureDevOpsIntegrationOptions> options,
    ILogger<AuthorityRunCompletedAzureDevOpsIntegrationEventHandler> logger) : IIntegrationEventHandler
{
    private readonly IAzureDevOpsPullRequestDecorator _decorator =
        decorator ?? throw new ArgumentNullException(nameof(decorator));

    private readonly IOptions<AzureDevOpsIntegrationOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<AuthorityRunCompletedAzureDevOpsIntegrationEventHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string EventType => IntegrationEventTypes.AuthorityRunCompletedV1;

    /// <inheritdoc />
    public async Task HandleAsync(ReadOnlyMemory<byte> utf8JsonPayload, CancellationToken cancellationToken)
    {
        AzureDevOpsIntegrationOptions o = _options.Value;

        if (!o.Enabled)
            return;

        if (o.RepositoryId == Guid.Empty || o.PullRequestId <= 0)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug("Azure DevOps PR decoration skipped: RepositoryId or PullRequestId not set.");

            return;
        }

        AuthorityRunCompletedPayload? payload;

        try
        {
            payload = JsonSerializer.Deserialize<AuthorityRunCompletedPayload>(
                utf8JsonPayload.Span,
                AuthorityRunCompletedPayloadJson.Options);
        }
        catch (JsonException ex)
        {
            throw new FormatException("Authority run completed payload was not valid JSON.", ex);
        }

        if (payload is null)
            throw new FormatException("Authority run completed payload deserialized to null.");

        AzureDevOpsPullRequestTarget target = new(o.RepositoryId, o.PullRequestId);

        IReadOnlyList<AuthorityRunCompletedFindingLink> links = MapFindingLinks(payload.Findings);

        AzureDevOpsManifestDeltaRequest request = new(
            payload.ManifestId,
            payload.RunId,
            payload.TenantId,
            payload.WorkspaceId,
            payload.ProjectId,
            payload.PreviousRunId,
            links);

        await _decorator.PostManifestDeltaAsync(request, target, cancellationToken).ConfigureAwait(false);
    }

    private static IReadOnlyList<AuthorityRunCompletedFindingLink> MapFindingLinks(
        IReadOnlyList<AuthorityRunCompletedFindingJsonDto>? rows)
    {
        if (rows is null || rows.Count == 0)
            return [];

        List<AuthorityRunCompletedFindingLink> links = new(capacity: rows.Count);
        links.AddRange(from row in rows
                       where row is not null
                       where !string.IsNullOrWhiteSpace(row.FindingId)
                       where !string.IsNullOrWhiteSpace(row.DeepLinkUrl)
                       select new AuthorityRunCompletedFindingLink(row.FindingId.Trim(), row.DeepLinkUrl.Trim(),
                           string.IsNullOrWhiteSpace(row.Severity) ? null : row.Severity.Trim()));

        return links;
    }

    private sealed record AuthorityRunCompletedPayload(
        int SchemaVersion,
        Guid RunId,
        Guid ManifestId,
        Guid TenantId,
        Guid WorkspaceId,
        Guid ProjectId,
        Guid? PreviousRunId,
        IReadOnlyList<AuthorityRunCompletedFindingJsonDto>? Findings);
}

internal static class AuthorityRunCompletedPayloadJson
{
    internal static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true, };
}
