using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Governance.Coverage;

public interface IRunCoverageAcknowledgementService
{
    Task<RunAcknowledgedCoverageDocument?> GetAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken);

    Task<RunAcknowledgedCoverageDocument> PutAcknowledgementAsync(
        ScopeContext scope,
        Guid runId,
        RunAcknowledgedCoverageDocument document,
        CancellationToken cancellationToken);

    Task<RunCoverageAcknowledgementEntry> PatchPackExclusionAsync(
        ScopeContext scope,
        Guid runId,
        Guid policyPackId,
        bool excluded,
        string? exclusionReason,
        CancellationToken cancellationToken);
}

public sealed class RunCoverageAcknowledgementService(
    ArchLucid.Persistence.Interfaces.IRunRepository runRepository,
    IPolicyPackRepository policyPackRepository,
    IActorContext actorContext,
    IAuditService auditService) : IRunCoverageAcknowledgementService
{
    private readonly ArchLucid.Persistence.Interfaces.IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IPolicyPackRepository _policyPackRepository =
        policyPackRepository ?? throw new ArgumentNullException(nameof(policyPackRepository));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<RunAcknowledgedCoverageDocument?> GetAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? header = await RequireMutableRunAsync(scope, runId, cancellationToken);
        return RunAcknowledgedCoverageJson.TryDeserialize(header.AcknowledgedCoverageJson);
    }

    public async Task<RunAcknowledgedCoverageDocument> PutAcknowledgementAsync(
        ScopeContext scope,
        Guid runId,
        RunAcknowledgedCoverageDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);

        RunRecord header = await RequireMutableRunAsync(scope, runId, cancellationToken);
        await ValidateEntriesAsync(document.Entries, cancellationToken);

        document.ActorUserId = _actorContext.GetActor();
        document.AcknowledgedUtc = TimeProvider.System.UtcNowDateTime();
        document.EvaluationVersion = RunAcknowledgedCoverageDocument.DocumentVersion;

        header.AcknowledgedCoverageJson = RunAcknowledgedCoverageJson.Serialize(document);
        await _runRepository.UpdateAsync(header, cancellationToken);
        await TryAuditAcknowledgedAsync(scope, runId, document, cancellationToken);

        return document;
    }

    public async Task<RunCoverageAcknowledgementEntry> PatchPackExclusionAsync(
        ScopeContext scope,
        Guid runId,
        Guid policyPackId,
        bool excluded,
        string? exclusionReason,
        CancellationToken cancellationToken)
    {
        if (excluded && string.IsNullOrWhiteSpace(exclusionReason))
            throw new ArgumentException("ExclusionReason is required when excluded is true.", nameof(exclusionReason));

        RunRecord header = await RequireMutableRunAsync(scope, runId, cancellationToken);
        PolicyPack? pack = await _policyPackRepository.GetByIdAsync(policyPackId, cancellationToken);

        if (pack is null || pack.TenantId != scope.TenantId)
            throw new ArgumentException($"Policy pack '{policyPackId}' was not found in the current scope.");

        RunAcknowledgedCoverageDocument document =
            RunAcknowledgedCoverageJson.TryDeserialize(header.AcknowledgedCoverageJson)
            ?? new RunAcknowledgedCoverageDocument();

        RunCoverageAcknowledgementEntry entry = new()
        {
            PolicyPackId = policyPackId,
            Excluded = excluded,
            ExclusionReason = excluded ? exclusionReason?.Trim() : null,
        };

        document.Entries.RemoveAll(row => row.PolicyPackId == policyPackId);
        document.Entries.Add(entry);

        await PutAcknowledgementAsync(scope, runId, document, cancellationToken);
        return entry;
    }

    private async Task ValidateEntriesAsync(
        IReadOnlyList<RunCoverageAcknowledgementEntry> entries,
        CancellationToken cancellationToken)
    {
        foreach (RunCoverageAcknowledgementEntry entry in entries)
        {
            if (entry.Excluded && string.IsNullOrWhiteSpace(entry.ExclusionReason))
                throw new ArgumentException(
                    $"ExclusionReason is required for policy pack '{entry.PolicyPackId}' when excluded.");

            PolicyPack? pack = await _policyPackRepository.GetByIdAsync(entry.PolicyPackId, cancellationToken);

            if (pack is null)
                throw new ArgumentException($"Policy pack '{entry.PolicyPackId}' was not found.");
        }
    }

    private async Task<RunRecord> RequireMutableRunAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (header is null)
            throw new RunNotFoundException(runId.ToString("N"));

        if (!string.IsNullOrWhiteSpace(header.GovernanceScopeJson))
            throw new InvalidOperationException("Coverage acknowledgement cannot change after execute has captured governance scope.");

        return header;
    }

    private async Task TryAuditAcknowledgedAsync(
        ScopeContext scope,
        Guid runId,
        RunAcknowledgedCoverageDocument document,
        CancellationToken cancellationToken)
    {
        try
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RunCoverageAcknowledged,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    RunId = runId,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        runId = runId.ToString("N"),
                        entryCount = document.Entries.Count,
                        excludedCount = document.Entries.Count(entry => entry.Excluded),
                    }),
                },
                cancellationToken);
        }
        catch (Exception)
        {
            // Audit failure must not block acknowledgement persistence.
        }
    }
}
