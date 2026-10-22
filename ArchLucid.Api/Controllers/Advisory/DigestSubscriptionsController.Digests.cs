using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Pagination;
using ArchLucid.Decisioning.Advisory.Delivery;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class DigestSubscriptionsController
{
    /// <summary>All delivery attempts recorded for a digest that belongs to the current scope.</summary>
    [HttpGet("digests/{digestId:guid}/attempts")]
    [ProducesResponseType(typeof(IReadOnlyList<DigestDeliveryAttempt>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttemptsForDigest(Guid digestId, CancellationToken ct = default)
    {
        DigestSubscriptionAttemptsResult result =
            await _digestSubscriptionFacade.ListAttemptsByDigestAsync(digestId, ct).ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Attempts!),
            DigestSubscriptionHttpOutcome.ResourceNotFound => this.NotFoundProblem(
                $"Digest '{digestId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected digest attempts outcome: {result.Outcome}."),
        };
    }

    /// <summary>
    ///     Batch delivery attempts for many digests in the current scope
    ///     (<c>?digestIds=guid,guid</c>). Digests outside scope yield empty attempt lists.
    /// </summary>
    [HttpGet("digests/attempts")]
    [ProducesResponseType(typeof(DigestDeliveryAttemptsBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAttemptsForDigestsBatch(
        [FromQuery] string? digestIds = null,
        CancellationToken ct = default)
    {
        if (!TryParseDigestIds(digestIds, out List<Guid> parsedIds, out string? parseError))
            return this.BadRequestProblem(parseError!, ProblemTypes.ValidationFailed);

        (DigestSubscriptionHttpOutcome outcome, DigestDeliveryAttemptsBatchDto? batch, string? message) =
            await _digestSubscriptionFacade.ListAttemptsByDigestIdsAsync(parsedIds, ct)
                .ConfigureAwait(false);

        return outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(MapBatch(batch!)),
            DigestSubscriptionHttpOutcome.ValidationFailed => this.BadRequestProblem(
                message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unexpected batch attempts outcome: {outcome}."),
        };
    }

    private static bool TryParseDigestIds(
        string? raw,
        out List<Guid> ids,
        out string? error)
    {
        ids = [];
        error = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            error = "digestIds is required (comma-separated GUIDs).";
            return false;
        }

        string[] parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length > PaginationDefaults.MaxPageSize)
        {
            error = $"digestIds must contain at most {PaginationDefaults.MaxPageSize} ids.";
            return false;
        }

        foreach (string part in parts)
        {
            if (!Guid.TryParse(part, out Guid digestId))
            {
                error = $"digestIds contains an invalid GUID: '{part}'.";
                return false;
            }

            ids.Add(digestId);
        }

        if (ids.Count == 0)
        {
            error = "digestIds is required (comma-separated GUIDs).";
            return false;
        }

        return true;
    }

    private static DigestDeliveryAttemptsBatchResponse MapBatch(DigestDeliveryAttemptsBatchDto batch) =>
        new()
        {
            Items = batch.Items
                .Select(static item => new DigestDeliveryAttemptsForDigestResponse
                {
                    DigestId = item.DigestId,
                    Attempts = item.Attempts.ToList(),
                })
                .ToList(),
        };
}
