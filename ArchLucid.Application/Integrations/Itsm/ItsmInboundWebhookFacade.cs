using System.Text.Json;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Security;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmInboundWebhookFacade" />
public sealed class ItsmInboundWebhookFacade(
    IOptionsMonitor<IntegrationsItsmInboundOptions> options,
    IItsmTenantConnectorCredentialResolver credentialResolver,
    ItsmInboundWebhookSyncService sync) : IItsmInboundWebhookFacade
{
    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IItsmTenantConnectorCredentialResolver _credentialResolver =
        credentialResolver ?? throw new ArgumentNullException(nameof(credentialResolver));

    private readonly ItsmInboundWebhookSyncService _sync =
        sync ?? throw new ArgumentNullException(nameof(sync));

    /// <inheritdoc />
    public async Task<ItsmInboundWebhookProcessHttpResult> ProcessAsync(
        ItsmInboundWebhookProcessRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.TenantId == Guid.Empty)
        {
            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.ValidationFailed,
                Message = "Tenant id is required.",
            };
        }

        string? sharedSecret = await ResolveInboundSecretAsync(request.TenantId, request.Provider, cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(sharedSecret))
        {
            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.Unauthorized,
            };
        }

        ItsmInboundWebhookProcessHttpResult? securityReject =
            TryVerifyWebhookSecurity(_options.CurrentValue, sharedSecret, request);

        if (securityReject is not null)
            return securityReject;

        if (!TryParseWebhookJson(request.RawBody, out JsonDocument? doc, out string? parseError))
        {
            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.ValidationFailed,
                Message = parseError,
            };
        }

        JsonDocument parsedDoc = doc!;
        using (parsedDoc)
        {
            JsonElement root = parsedDoc.RootElement;
            ItsmInboundWebhookProcessResult processResult = request.Provider switch
            {
                TenantItsmConnectorProvider.Jira => await _sync.TryProcessJiraIssueUpdateAsync(
                    root,
                    cancellationToken,
                    request.PayloadUtf8Bytes,
                    request.DeliveryId,
                    request.TenantId).ConfigureAwait(false),
                TenantItsmConnectorProvider.ServiceNow => await _sync.TryProcessServiceNowIncidentUpdateAsync(
                    root,
                    cancellationToken,
                    request.PayloadUtf8Bytes,
                    request.DeliveryId,
                    request.TenantId).ConfigureAwait(false),
                _ => throw new ArgumentOutOfRangeException(nameof(request), request.Provider, null),
            };

            if (!processResult.Accepted)
            {
                return new ItsmInboundWebhookProcessHttpResult
                {
                    Outcome = ItsmInboundWebhookHttpOutcome.ValidationFailed,
                    Message = request.Provider switch
                    {
                        TenantItsmConnectorProvider.Jira => "Unrecognized Jira webhook payload.",
                        TenantItsmConnectorProvider.ServiceNow => "Unrecognized ServiceNow webhook payload.",
                        _ => "Unrecognized webhook payload.",
                    },
                    DurableAuditEvent = processResult.DurableAuditEvent,
                };
            }

            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.Success,
                DurableAuditEvent = processResult.DurableAuditEvent,
            };
        }
    }

    private async Task<string?> ResolveInboundSecretAsync(
        Guid? tenantId,
        TenantItsmConnectorProvider provider,
        CancellationToken ct)
    {
        if (tenantId is { } scopedTenantId && scopedTenantId != Guid.Empty)
        {
            return await _credentialResolver
                .TryResolveInboundWebhookSecretAsync(scopedTenantId, provider, ct)
                .ConfigureAwait(false);
        }

        IntegrationsItsmInboundOptions inbound = _options.CurrentValue;

        if (!inbound.AllowDeploymentWideWebhookSecrets)
            return null;

        return provider switch
        {
            TenantItsmConnectorProvider.Jira => string.IsNullOrWhiteSpace(inbound.JiraWebhookSecret)
                ? null
                : inbound.JiraWebhookSecret,
            TenantItsmConnectorProvider.ServiceNow => string.IsNullOrWhiteSpace(inbound.ServiceNowWebhookSecret)
                ? null
                : inbound.ServiceNowWebhookSecret,
            TenantItsmConnectorProvider.AzureBoards => null,
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null),
        };
    }

    private static ItsmInboundWebhookProcessHttpResult? TryVerifyWebhookSecurity(
        IntegrationsItsmInboundOptions options,
        string sharedSecret,
        ItsmInboundWebhookProcessRequest request)
    {
        if (!WebhookSecrets.SecureEquals(request.VendorToken, sharedSecret))
        {
            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.Unauthorized,
            };
        }

        if (!TryValidateOptionalTimestampSkew(options, request.TimestampHeader, out ItsmInboundWebhookProcessHttpResult? reject))
            return reject;

        if (!options.RequireBodyHmacSignature)
            return null;

        if (!WebhookSecrets.IsValidHmacSha256Signature(sharedSecret, request.RawBody, request.HmacSignature))
        {
            return new ItsmInboundWebhookProcessHttpResult
            {
                Outcome = ItsmInboundWebhookHttpOutcome.Unauthorized,
            };
        }

        return null;
    }

    private static bool TryValidateOptionalTimestampSkew(
        IntegrationsItsmInboundOptions options,
        string? timestampHeader,
        out ItsmInboundWebhookProcessHttpResult? reject)
    {
        reject = null;

        if (options.WebhookTimestampSkewSeconds <= 0)
            return true;

        if (string.IsNullOrWhiteSpace(timestampHeader))
            return true;

        if (WebhookSecrets.TimestampWithinSkew(TimeProvider.System.GetUtcNow(), timestampHeader, options.WebhookTimestampSkewSeconds))
            return true;

        reject = new ItsmInboundWebhookProcessHttpResult
        {
            Outcome = ItsmInboundWebhookHttpOutcome.Unauthorized,
        };

        return false;
    }

    private static bool TryParseWebhookJson(string rawBody, out JsonDocument? doc, out string? error)
    {
        try
        {
            doc = JsonDocument.Parse(rawBody);
            error = null;
            return true;
        }
        catch (JsonException)
        {
            doc = null;
            error = "Malformed ITSM webhook JSON body.";
            return false;
        }
    }
}
