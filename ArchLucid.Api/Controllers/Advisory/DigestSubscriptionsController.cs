using ArchLucid.Api.Attributes;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Advisory;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Advisory;

/// <summary>
///     Manages <see cref="DigestSubscription" /> routes for architecture digests (email/webhook delivery after advisory
///     scans).
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/digest-subscriptions")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class DigestSubscriptionsController(IDigestSubscriptionFacade digestSubscriptionFacade) : ControllerBase
{
    private readonly IDigestSubscriptionFacade _digestSubscriptionFacade =
        digestSubscriptionFacade ?? throw new ArgumentNullException(nameof(digestSubscriptionFacade));

    /// <summary>Creates a subscription stamped with the current scope; mutating action requires execute authority.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IDigestSubscriptionFacade.CreateAsync logs DigestSubscriptionCreated.")]
    [ProducesResponseType(typeof(DigestSubscription), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        [FromBody] DigestSubscription? subscription,
        CancellationToken ct = default)
    {
        if (subscription is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        DigestSubscriptionCreateResult result = await _digestSubscriptionFacade.CreateAsync(subscription, ct)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Subscription!),
            DigestSubscriptionHttpOutcome.ValidationFailed => this.BadRequestProblem(
                result.Message ?? "Validation failed.",
                ProblemTypes.ValidationFailed),
            _ => throw new InvalidOperationException($"Unexpected create outcome: {result.Outcome}."),
        };
    }

    /// <summary>Lists digest subscriptions for the caller's tenant/workspace/project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<DigestSubscription>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DigestSubscription>>> List(CancellationToken ct = default)
    {
        IReadOnlyList<DigestSubscription> result = await _digestSubscriptionFacade.ListByScopeAsync(ct)
            .ConfigureAwait(false);
        return Ok(result);
    }

    /// <summary>Toggles <see cref="DigestSubscription.IsEnabled" /> when the row is in scope.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{subscriptionId:guid}/toggle")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IDigestSubscriptionFacade.ToggleAsync logs DigestSubscriptionToggled.")]
    [ProducesResponseType(typeof(DigestSubscription), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Toggle(Guid subscriptionId, CancellationToken ct = default)
    {
        DigestSubscriptionToggleResult result = await _digestSubscriptionFacade.ToggleAsync(subscriptionId, ct)
            .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Subscription!),
            DigestSubscriptionHttpOutcome.ResourceNotFound => this.NotFoundProblem(
                $"Digest subscription '{subscriptionId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected toggle outcome: {result.Outcome}."),
        };
    }

    /// <summary>Recent delivery attempts for a subscription in scope.</summary>
    [HttpGet("{subscriptionId:guid}/attempts")]
    [ProducesResponseType(typeof(IReadOnlyList<DigestDeliveryAttempt>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttempts(
        Guid subscriptionId,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        DigestSubscriptionAttemptsResult result =
            await _digestSubscriptionFacade.ListAttemptsBySubscriptionAsync(subscriptionId, take, ct)
                .ConfigureAwait(false);

        return result.Outcome switch
        {
            DigestSubscriptionHttpOutcome.Success => Ok(result.Attempts!),
            DigestSubscriptionHttpOutcome.ResourceNotFound => this.NotFoundProblem(
                $"Digest subscription '{subscriptionId}' was not found in the current scope.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected attempts outcome: {result.Outcome}."),
        };
    }

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
