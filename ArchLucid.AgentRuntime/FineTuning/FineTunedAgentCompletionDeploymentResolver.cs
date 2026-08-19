using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Registry;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.FineTuning;

/// <summary>
///     Routes agent completions to a tenant's promoted fine-tuned deployment when fine-tuning is enabled and consented.
/// </summary>
public sealed class FineTunedAgentCompletionDeploymentResolver(
    IOptionsMonitor<FineTuningOptions> options,
    IFineTuningConsentService consentService,
    IFineTunedModelRegistry registry,
    ILogger<FineTunedAgentCompletionDeploymentResolver> logger) : IAgentCompletionDeploymentResolver
{
    private readonly IOptionsMonitor<FineTuningOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IFineTuningConsentService _consentService =
        consentService ?? throw new ArgumentNullException(nameof(consentService));

    private readonly IFineTunedModelRegistry _registry =
        registry ?? throw new ArgumentNullException(nameof(registry));

    private readonly ILogger<FineTunedAgentCompletionDeploymentResolver> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<string> ResolveDeploymentNameAsync(
        Guid tenantId,
        string defaultDeploymentName,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(defaultDeploymentName);

        try
        {
            if (!_options.CurrentValue.Enabled)
            {
                return defaultDeploymentName;
            }

            FineTuningConsentStatus consent = await _consentService
                .GetConsentAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            if (consent != FineTuningConsentStatus.Enabled)
            {
                return defaultDeploymentName;
            }

            FineTunedModelRegistryEntry? entry = await _registry
                .TryGetActiveAsync(tenantId, cancellationToken)
                .ConfigureAwait(false);

            if (entry is null || entry.PromotedUtc is null)
            {
                return defaultDeploymentName;
            }

            string? fineTunedDeployment = entry.FineTunedModelDeploymentName?.Trim();

            if (string.IsNullOrEmpty(fineTunedDeployment))
            {
                return defaultDeploymentName;
            }

            return fineTunedDeployment;
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Fine-tuned deployment resolution failed for tenant {TenantId}; using default deployment.",
                tenantId);

            return defaultDeploymentName;
        }
    }
}
