using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration.Summary;

namespace ArchLucid.Application.Admin;

/// <summary>Projects workspace-allowed engines for per-review selection (TB-2110).</summary>
public sealed class ModelEngineSelectionOptionsBuilder(
    IWorkspaceAllowedEngineSetService allowedEngineSetService,
    IAgentModelAliasRegistry aliasRegistry)
{
    private readonly IWorkspaceAllowedEngineSetService _allowedEngineSetService =
        allowedEngineSetService ?? throw new ArgumentNullException(nameof(allowedEngineSetService));

    private readonly IAgentModelAliasRegistry _aliasRegistry =
        aliasRegistry ?? throw new ArgumentNullException(nameof(aliasRegistry));

    public async Task<ModelEngineSelectionOptionsResponse> BuildAsync(CancellationToken cancellationToken)
    {
        WorkspaceAllowedEngineSetSnapshot allowedSet =
            await _allowedEngineSetService.GetAsync(cancellationToken).ConfigureAwait(false);

        List<ModelEngineSelectionOptionResponse> options = [];

        foreach (string aliasId in allowedSet.AllowedAliasIds)
        {
            if (!_aliasRegistry.TryGet(aliasId, out AgentModelAliasRegistryEntry? entry) || entry is null)
            {
                continue;
            }

            options.Add(
                new ModelEngineSelectionOptionResponse
                {
                    AliasId = entry.AliasId,
                    StructuredOutputLevel = entry.StructuredOutputLevel.ToString(),
                    TaskEvaluations = entry.TaskEvaluations
                        .Select(
                            evaluation => new ModelAliasTaskEvaluationResponse
                            {
                                TaskType = evaluation.TaskType,
                                EvaluationState = evaluation.EvaluationState.ToString(),
                                EvidenceJson = evaluation.EvidenceJson,
                                EvaluatedUtc = evaluation.EvaluatedUtc
                            })
                        .OrderBy(evaluation => evaluation.TaskType, StringComparer.OrdinalIgnoreCase)
                        .ToList()
                });
        }

        return new ModelEngineSelectionOptionsResponse
        {
            DefaultAliasId = allowedSet.DefaultAliasId,
            Options = options.OrderBy(option => option.AliasId, StringComparer.OrdinalIgnoreCase).ToList()
        };
    }
}
