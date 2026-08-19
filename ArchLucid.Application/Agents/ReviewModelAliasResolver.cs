using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Agents;

public sealed class ReviewModelAliasResolver(
    IWorkspaceAllowedEngineSetService allowedEngineSetService,
    IAgentModelAliasRegistry aliasRegistry,
    IExternalSubprocessorEngineAcknowledgmentService acknowledgmentService) : IReviewModelAliasResolver
{
    private readonly IWorkspaceAllowedEngineSetService _allowedEngineSetService =
        allowedEngineSetService ?? throw new ArgumentNullException(nameof(allowedEngineSetService));

    private readonly IAgentModelAliasRegistry _aliasRegistry =
        aliasRegistry ?? throw new ArgumentNullException(nameof(aliasRegistry));

    private readonly IExternalSubprocessorEngineAcknowledgmentService _acknowledgmentService =
        acknowledgmentService ?? throw new ArgumentNullException(nameof(acknowledgmentService));

    public async Task<ReviewModelAliasResolution> ResolveForRunCreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        WorkspaceAllowedEngineSetSnapshot allowedSet =
            await _allowedEngineSetService.GetAsync(cancellationToken).ConfigureAwait(false);

        string? requestedOverride = request.ModelAliasOverride;

        if (string.IsNullOrWhiteSpace(requestedOverride))
        {
            return new ReviewModelAliasResolution(
                allowedSet.DefaultAliasId,
                allowedSet.DefaultAliasId,
                null,
                false,
                false);
        }

        string trimmed = requestedOverride.Trim();

        if (!_allowedEngineSetService.IsAliasAllowed(allowedSet, trimmed))
        {
            return new ReviewModelAliasResolution(
                allowedSet.DefaultAliasId,
                allowedSet.DefaultAliasId,
                trimmed,
                true,
                false);
        }

        AgentModelAliasRegistryEntry entry = _aliasRegistry.GetRequired(trimmed);

        if (entry.DataBoundary is AgentModelDataBoundaryKind.ExternalSubprocessor)
        {
            bool acknowledged = await _acknowledgmentService
                .HasWorkspaceAcknowledgmentAsync(cancellationToken)
                .ConfigureAwait(false);

            if (!acknowledged)
            {
                return new ReviewModelAliasResolution(
                    allowedSet.DefaultAliasId,
                    allowedSet.DefaultAliasId,
                    trimmed,
                    true,
                    true);
            }
        }

        return new ReviewModelAliasResolution(
            trimmed,
            allowedSet.DefaultAliasId,
            trimmed,
            false,
            false);
    }
}
