using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Decorates <see cref="CachedAgentSystemPromptCatalog" /> with optional weighted prompt variants when
///     <see cref="PromptVariantOptions.Enabled" /> is true.
/// </summary>
public sealed class VariantAwareAgentSystemPromptCatalog(
    CachedAgentSystemPromptCatalog innerCatalog,
    IPromptVariantSelector variantSelector,
    IOptionsMonitor<PromptVariantOptions> variantOptions) : IAgentSystemPromptCatalog
{
    private readonly CachedAgentSystemPromptCatalog _innerCatalog =
        innerCatalog ?? throw new ArgumentNullException(nameof(innerCatalog));

    private readonly IPromptVariantSelector _variantSelector =
        variantSelector ?? throw new ArgumentNullException(nameof(variantSelector));

    private readonly IOptionsMonitor<PromptVariantOptions> _variantOptions =
        variantOptions ?? throw new ArgumentNullException(nameof(variantOptions));

    /// <inheritdoc />
    public async Task<ResolvedSystemPrompt> ResolveAsync(
        AgentType agentType,
        Guid? tenantId = null,
        Guid? runId = null,
        CancellationToken cancellationToken = default)
    {
        ResolvedSystemPrompt baseline = await _innerCatalog
            .ResolveAsync(agentType, tenantId, runId, cancellationToken)
            .ConfigureAwait(false);

        if (!_variantOptions.CurrentValue.Enabled || tenantId is null || runId is null)
            return baseline;

        string templateName = PromptTemplateNameResolver.FromAgentType(agentType);

        PromptVariantSelection? selection = await _variantSelector
            .TrySelectAsync(templateName, tenantId.Value, runId.Value, baseline.Text, cancellationToken)
            .ConfigureAwait(false);

        if (selection is null)
            return baseline;

        string hash = AgentPromptCanonicalHasher.Sha256HexUtf8Normalized(selection.PromptBody);

        return baseline with
        {
            Text = selection.PromptBody,
            ContentSha256Hex = hash,
            PromptVariantKey = selection.VariantKey
        };
    }
}
