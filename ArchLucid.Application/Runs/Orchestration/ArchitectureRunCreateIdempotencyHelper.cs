using System.Security.Cryptography;

using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Idempotency replay, race resolution, and gate-key helpers for architecture run creation.
/// </summary>
public sealed class ArchitectureRunCreateIdempotencyHelper(
    IArchitectureRunIdempotencyRepository architectureRunIdempotencyRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    ILogger<ArchitectureRunCreateIdempotencyHelper> logger)
{
    private readonly IArchitectureRunIdempotencyRepository _architectureRunIdempotencyRepository =
        architectureRunIdempotencyRepository ?? throw new ArgumentNullException(nameof(architectureRunIdempotencyRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IEvidenceBundleRepository _evidenceBundleRepository =
        evidenceBundleRepository ?? throw new ArgumentNullException(nameof(evidenceBundleRepository));

    private readonly ILogger<ArchitectureRunCreateIdempotencyHelper> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public static string BuildIdempotencyGateKey(CreateRunIdempotencyState idempotency)
    {
        ArgumentNullException.ThrowIfNull(idempotency);
        byte[] hash = idempotency.IdempotencyKeyHash;

        if (hash is null || hash.Length == 0)
            throw new ArgumentException("Idempotency key hash must be non-empty.", nameof(idempotency));

        return string.Concat(
            idempotency.TenantId.ToString("N"),
            "|",
            idempotency.WorkspaceId.ToString("N"),
            "|",
            idempotency.ProjectId.ToString("N"),
            "|",
            Convert.ToHexString(hash));
    }

    public async Task<CreateRunResult?> TryReplayFromIdempotencyAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? existing = await _architectureRunIdempotencyRepository.TryGetAsync(
            idempotency.TenantId,
            idempotency.WorkspaceId,
            idempotency.ProjectId,
            idempotency.IdempotencyKeyHash,
            cancellationToken);

        if (existing is null)
            return null;

        if (!CryptographicOperations.FixedTimeEquals(existing.RequestFingerprint, idempotency.RequestFingerprint))
            throw new ConflictException("The Idempotency-Key was already used with a different request body.");

        return await RehydrateCreateRunResultAsync(existing.RunId, cancellationToken);
    }

    public async Task<CreateRunResult?> ResolveIdempotencyRaceAsync(
        CreateRunIdempotencyState idempotency,
        CancellationToken cancellationToken)
    {
        ArchitectureRunIdempotencyLookup? winner = await _architectureRunIdempotencyRepository.TryGetAsync(
            idempotency.TenantId,
            idempotency.WorkspaceId,
            idempotency.ProjectId,
            idempotency.IdempotencyKeyHash,
            cancellationToken);

        if (winner is null)
            return null;

        if (!CryptographicOperations.FixedTimeEquals(winner.RequestFingerprint, idempotency.RequestFingerprint))
            throw new ConflictException("The Idempotency-Key was already used with a different request body.");

        return await RehydrateCreateRunResultAsync(winner.RunId, cancellationToken);
    }

    private async Task<CreateRunResult> RehydrateCreateRunResultAsync(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRun? run = await ArchitectureRunAuthorityReader.TryGetArchitectureRunAsync(
            _runRepository,
            _scopeContextProvider,
            _taskRepository,
            runId,
            cancellationToken);

        if (run is null)
            throw new InvalidOperationException($"Run '{runId}' from idempotency store was not found.");

        ScopeContext rehydrateScope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<AgentTask> tasks = await _taskRepository.GetByRunIdAsync(rehydrateScope, runId, cancellationToken);

        if (tasks.Count == 0)
            throw new InvalidOperationException($"Idempotent run '{runId}' has no tasks.");

        string? bundleRef = tasks[0].EvidenceBundleRef;

        if (string.IsNullOrWhiteSpace(bundleRef))
            throw new InvalidOperationException($"Idempotent run '{runId}' is missing EvidenceBundleRef on the first task.");

        EvidenceBundle bundle = await _evidenceBundleRepository.GetByIdAsync(bundleRef, cancellationToken)
            ?? throw new InvalidOperationException($"Evidence bundle '{bundleRef}' for idempotent run was not found.");

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "CreateRun idempotent replay: RunId={RunId}, TaskCount={TaskCount}",
                LogSanitizer.Sanitize(runId),
                tasks.Count);
        }

        return new CreateRunResult
        {
            Run = run,
            EvidenceBundle = bundle,
            Tasks = tasks.ToList(),
            IdempotentReplay = true
        };
    }
}
