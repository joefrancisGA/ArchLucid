using System.Text.Json;

using ArchLucid.Core.Integration;

namespace ArchLucid.Notifications;

/// <summary>
///     Delivers Slack/Teams ChatOps notices when <see cref="IntegrationEventTypes.AuthorityRunCompletedV1" /> is consumed
///     from Service Bus (replaces the direct hook call from persistence finalization).
/// </summary>
public sealed class AuthorityRunCompletedChatOpsIntegrationEventHandler(
    IAuthorityRunCommittedChatOpsHook chatOpsHook) : IIntegrationEventHandler
{
    private readonly IAuthorityRunCommittedChatOpsHook _chatOpsHook =
        chatOpsHook ?? throw new ArgumentNullException(nameof(chatOpsHook));

    /// <inheritdoc />
    public string EventType => IntegrationEventTypes.AuthorityRunCompletedV1;

    /// <inheritdoc />
    public async Task HandleAsync(ReadOnlyMemory<byte> utf8JsonPayload, CancellationToken cancellationToken)
    {
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

        AuthorityRunCommittedChatOpsNotice notice = new()
        {
            TenantId = payload.TenantId,
            WorkspaceId = payload.WorkspaceId,
            ProjectId = payload.ProjectId,
            RunId = payload.RunId,
            FindingCount = payload.Findings?.Count ?? 0,
            Description = payload.Description,
        };

        await _chatOpsHook.NotifyAsync(notice, cancellationToken).ConfigureAwait(false);
    }

    private sealed record AuthorityRunCompletedPayload(
        int SchemaVersion,
        Guid RunId,
        Guid ManifestId,
        Guid TenantId,
        Guid WorkspaceId,
        Guid ProjectId,
        Guid? PreviousRunId,
        string? Description,
        IReadOnlyList<AuthorityRunCompletedFindingJsonDto>? Findings);

    private sealed record AuthorityRunCompletedFindingJsonDto(
        string? FindingId,
        string? DeepLinkUrl,
        string? Severity);
}

internal static class AuthorityRunCompletedPayloadJson
{
    internal static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true };
}
