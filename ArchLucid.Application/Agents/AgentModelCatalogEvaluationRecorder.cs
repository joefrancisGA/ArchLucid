using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using System.Text.Json;

namespace ArchLucid.Application.Agents;

public interface IAgentModelCatalogEvaluationRecorder
{
    Task<AgentModelCatalogRow> RecordTaskEvaluationAsync(
        string aliasId,
        string taskType,
        AgentModelEvaluationStateKind evaluationState,
        string? evidenceJson,
        string actorUserId,
        CancellationToken cancellationToken);
}

/// <summary>Operator-triggered evaluation evidence recording (TB-2105).</summary>
public sealed class AgentModelCatalogEvaluationRecorder(
    IAgentModelCatalogRepository catalogRepository,
    IAgentModelCatalogCacheInvalidator cacheInvalidator,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider) : IAgentModelCatalogEvaluationRecorder
{
    private readonly IAgentModelCatalogRepository _catalogRepository =
        catalogRepository ?? throw new ArgumentNullException(nameof(catalogRepository));

    private readonly IAgentModelCatalogCacheInvalidator _cacheInvalidator =
        cacheInvalidator ?? throw new ArgumentNullException(nameof(cacheInvalidator));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<AgentModelCatalogRow> RecordTaskEvaluationAsync(
        string aliasId,
        string taskType,
        AgentModelEvaluationStateKind evaluationState,
        string? evidenceJson,
        string actorUserId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(aliasId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskType);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorUserId);

        AgentModelCatalogRow? existing = await _catalogRepository.TryGetAsync(aliasId, cancellationToken).ConfigureAwait(false);

        if (existing is null)
        {
            throw new KeyNotFoundException($"Model alias '{aliasId}' is not registered.");
        }

        string normalizedTaskType = taskType.Trim();
        List<AgentModelCatalogEvaluationRow> evaluations = existing.Evaluations.ToList();
        int existingIndex = evaluations.FindIndex(
            row => string.Equals(row.TaskType, normalizedTaskType, StringComparison.OrdinalIgnoreCase));

        AgentModelCatalogEvaluationRow updatedEvaluation = new()
        {
            TaskType = normalizedTaskType,
            EvaluationState = evaluationState,
            EvidenceJson = evidenceJson,
            EvaluatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
        };

        if (existingIndex >= 0)
        {
            evaluations[existingIndex] = updatedEvaluation;
        }
        else
        {
            evaluations.Add(updatedEvaluation);
        }

        AgentModelCatalogRow updatedRow = new()
        {
            AliasId = existing.AliasId,
            ProviderConnectionKind = existing.ProviderConnectionKind,
            DeploymentName = existing.DeploymentName,
            TierBinding = existing.TierBinding,
            CapabilityTags = existing.CapabilityTags,
            ApprovedTaskTypes = existing.ApprovedTaskTypes,
            StructuredOutputLevel = existing.StructuredOutputLevel,
            DataBoundary = existing.DataBoundary,
            LifecycleStatus = existing.LifecycleStatus,
            StructuredOutputProbeUtc = existing.StructuredOutputProbeUtc,
            Evaluations = evaluations
        };

        await _catalogRepository.UpsertAsync(updatedRow, cancellationToken).ConfigureAwait(false);
        _cacheInvalidator.Invalidate();

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ModelCatalogEvaluationRecorded,
                ActorUserId = actorUserId,
                ActorUserName = actorUserId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        aliasId = updatedRow.AliasId,
                        taskType = normalizedTaskType,
                        evaluationState = evaluationState.ToString()
                    })
            },
            cancellationToken).ConfigureAwait(false);

        AgentModelCatalogRow? saved = await _catalogRepository.TryGetAsync(aliasId, cancellationToken).ConfigureAwait(false);

        return saved ?? updatedRow;
    }
}
