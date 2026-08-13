using ArchLucid.Contracts.Common;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Application.Agents;

/// <summary>Seeds the default three managed Azure aliases when the catalog is empty (TB-2103).</summary>
public static class AgentModelCatalogDefaultSeed
{
    public static IReadOnlyList<AgentModelCatalogRow> BuildDefaultRows()
    {
        AgentModelCatalogRow economy = BuildManagedRow(
            AgentModelAliasIds.EconomyGeneral,
            LlmModelTier.Economy,
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.Primary,
                AgentModelTaskTypes.SchemaRemediation
            ]);

        AgentModelCatalogRow standard = BuildManagedRow(
            AgentModelAliasIds.StandardGeneral,
            LlmModelTier.Standard,
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse,
                AgentModelAliasCapabilities.LongContext
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.FromAgentType(AgentType.Compliance),
                AgentModelTaskTypes.FromAgentType(AgentType.Critic),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.Primary,
                InsightDensityJudgeAgentTypeNames.Judge
            ]);

        AgentModelCatalogRow premium = BuildManagedRow(
            AgentModelAliasIds.PremiumAssurance,
            LlmModelTier.Premium,
            [
                AgentModelAliasCapabilities.StructuredOutput,
                AgentModelAliasCapabilities.ToolUse,
                AgentModelAliasCapabilities.LongContext,
                AgentModelAliasCapabilities.AdvancedReasoning
            ],
            [
                AgentModelTaskTypes.FromAgentType(AgentType.Topology),
                AgentModelTaskTypes.FromAgentType(AgentType.Cost),
                AgentModelTaskTypes.FromAgentType(AgentType.Compliance),
                AgentModelTaskTypes.FromAgentType(AgentType.Critic),
                AgentModelTaskTypes.Ask,
                AgentModelTaskTypes.Explanation,
                AgentModelTaskTypes.SemanticJudge,
                AgentModelTaskTypes.Primary,
                InsightDensityJudgeAgentTypeNames.Judge
            ]);

        return [economy, standard, premium];
    }

    private static AgentModelCatalogRow BuildManagedRow(
        string aliasId,
        LlmModelTier tier,
        IReadOnlyList<string> capabilityTags,
        IReadOnlyList<string> approvedTaskTypes)
    {
        return new AgentModelCatalogRow
        {
            AliasId = aliasId,
            ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
            TierBinding = tier.ToString(),
            CapabilityTags = capabilityTags,
            ApprovedTaskTypes = approvedTaskTypes,
            StructuredOutputLevel = AgentModelStructuredOutputLevel.StrictJsonSchema,
            DataBoundary = AgentModelDataBoundaryKind.AzureBoundary,
            LifecycleStatus = AgentModelCatalogLifecycleStatus.Available,
            Evaluations = approvedTaskTypes
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(
                    taskType => new AgentModelCatalogEvaluationRow
                    {
                        TaskType = taskType,
                        EvaluationState = AgentModelEvaluationStateKind.NotEvaluated
                    })
                .ToList()
        };
    }
}

/// <summary>Ensures default catalog rows exist at startup (TB-2103).</summary>
public sealed class AgentModelCatalogBootstrapper(
    IAgentModelCatalogRepository catalogRepository,
    IAgentModelCatalogCacheInvalidator cacheInvalidator)
{
    private readonly IAgentModelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IAgentModelCatalogCacheInvalidator _cacheInvalidator =
        cacheInvalidator ?? throw new ArgumentNullException(nameof(cacheInvalidator));

    public async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        int count = await _catalogRepository.CountAsync(cancellationToken).ConfigureAwait(false);

        if (count > 0)
        {
            return;
        }

        foreach (AgentModelCatalogRow row in AgentModelCatalogDefaultSeed.BuildDefaultRows())
        {
            await _catalogRepository.UpsertAsync(row, cancellationToken).ConfigureAwait(false);
        }

        _cacheInvalidator.Invalidate();
    }
}
