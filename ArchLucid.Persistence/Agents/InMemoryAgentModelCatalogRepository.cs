using ArchLucid.Core.Agents;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Persistence.Agents;

/// <summary>In-memory catalog for SQL-disabled hosts (TB-2103).</summary>
public sealed class InMemoryAgentModelCatalogRepository : IAgentModelCatalogRepository
{
    private readonly object _gate = new();
    private readonly List<AgentModelCatalogRow> _rows = [];

    public Task<int> CountAsync(CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            return Task.FromResult(_rows.Count);
        }
    }

    public Task<IReadOnlyList<AgentModelCatalogRow>> ListAllAsync(CancellationToken cancellationToken)
    {
        lock (_gate)
        {
            return Task.FromResult<IReadOnlyList<AgentModelCatalogRow>>(_rows.Select(Clone).ToList());
        }
    }

    public Task<AgentModelCatalogRow?> TryGetAsync(string aliasId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(aliasId))
        {
            return Task.FromResult<AgentModelCatalogRow?>(null);
        }

        lock (_gate)
        {
            AgentModelCatalogRow? row = _rows.FirstOrDefault(
                entry => string.Equals(entry.AliasId, aliasId.Trim(), StringComparison.OrdinalIgnoreCase));

            return Task.FromResult(row is null ? null : Clone(row));
        }
    }

    public Task UpsertAsync(AgentModelCatalogRow row, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);

        lock (_gate)
        {
            int index = _rows.FindIndex(
                entry => string.Equals(entry.AliasId, row.AliasId, StringComparison.OrdinalIgnoreCase));

            if (index >= 0)
            {
                _rows[index] = Clone(row);
            }
            else
            {
                _rows.Add(Clone(row));
            }
        }

        return Task.CompletedTask;
    }

    private static AgentModelCatalogRow Clone(AgentModelCatalogRow row) =>
        new()
        {
            AliasId = row.AliasId,
            ProviderConnectionKind = row.ProviderConnectionKind,
            DeploymentName = row.DeploymentName,
            TierBinding = row.TierBinding,
            CapabilityTags = row.CapabilityTags.ToList(),
            ApprovedTaskTypes = row.ApprovedTaskTypes.ToList(),
            StructuredOutputLevel = row.StructuredOutputLevel,
            DataBoundary = row.DataBoundary,
            ExternalSubprocessorDisclosureComplete = row.ExternalSubprocessorDisclosureComplete,
            LifecycleStatus = row.LifecycleStatus,
            StructuredOutputProbeUtc = row.StructuredOutputProbeUtc,
            TokenizerProfile = row.TokenizerProfile,
            CharsPerToken = row.CharsPerToken,
            TokenizerErrorMarginPercent = row.TokenizerErrorMarginPercent,
            InputUsdPerMillionTokens = row.InputUsdPerMillionTokens,
            OutputUsdPerMillionTokens = row.OutputUsdPerMillionTokens,
            ReasoningUsdPerMillionTokens = row.ReasoningUsdPerMillionTokens,
            Evaluations = row.Evaluations
                .Select(
                    evaluation => new AgentModelCatalogEvaluationRow
                    {
                        TaskType = evaluation.TaskType,
                        EvaluationState = evaluation.EvaluationState,
                        EvidenceJson = evaluation.EvidenceJson,
                        EvaluatedUtc = evaluation.EvaluatedUtc
                    })
                .ToList()
        };
}
