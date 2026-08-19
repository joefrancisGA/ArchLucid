using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Agents;

public sealed class ModelExecutionProfileResolver(
    IWorkspaceModelExecutionProfileService workspaceProfileService) : IModelExecutionProfileResolver
{
    private readonly IWorkspaceModelExecutionProfileService _workspaceProfileService =
        workspaceProfileService ?? throw new ArgumentNullException(nameof(workspaceProfileService));

    public async Task<ModelExecutionProfileResolution> ResolveForRunCreateAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        WorkspaceModelExecutionProfileSnapshot workspaceSnapshot =
            await _workspaceProfileService.GetAsync(cancellationToken).ConfigureAwait(false);

        AgentModelExecutionProfile workspaceDefault = workspaceSnapshot.EffectiveProfile;
        string? requestedOverride = request.ModelExecutionProfileOverride;

        if (string.IsNullOrWhiteSpace(requestedOverride))
        {
            return new ModelExecutionProfileResolution(
                workspaceDefault,
                workspaceDefault,
                null,
                false);
        }

        if (AgentModelExecutionProfileParser.TryParse(requestedOverride, out AgentModelExecutionProfile parsedOverride))
        {
            return new ModelExecutionProfileResolution(
                parsedOverride,
                workspaceDefault,
                requestedOverride.Trim(),
                false);
        }

        return new ModelExecutionProfileResolution(
            workspaceDefault,
            workspaceDefault,
            requestedOverride.Trim(),
            true);
    }
}
