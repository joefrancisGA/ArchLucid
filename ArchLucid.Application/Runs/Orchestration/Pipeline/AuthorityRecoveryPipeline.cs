using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>Queued Authority recovery using the same stages, hydration and publish gate as inline execution.</summary>
public sealed class AuthorityRecoveryPipeline(
    IAnalysisRecoveryRepository checkpoints,
    IArchLucidUnitOfWorkFactory transactions,
    AuthorityPipelineStagesExecutor executor,
    IOptionsMonitor<AnalysisStageExecutionOptions> options,
    TimeProvider clock,
    ILogger<AuthorityRecoveryPipeline> logger,
    IOptionsMonitor<IntegrationEventsOptions> integrationOptions,
    AnalysisDependencyConfiguration? dependencies = null)
{
    private const string Pipeline = "authority";
    private const string Publish = "seal_and_publish";
    private static readonly string[] ResumableStages =
    [
        AuthorityPipelineStageNames.ContextIngestion, AuthorityPipelineStageNames.Graph, AuthorityPipelineStageNames.Findings
    ];

    internal async Task<bool> IsPublishedAsync(ScopeContext scope, RunRecord run, CancellationToken ct)
    {
        AnalysisRecoveryClaim? claim = await checkpoints.ReadAsync(Key(scope, run.RunId, Publish), ct);

        if (claim is not { State: "succeeded" })
            return false;

        if (run.GoldenManifestId is not Guid manifest || run.ArtifactBundleId is null ||
            !string.Equals(claim.ResultReference, manifest.ToString("D"), StringComparison.Ordinal))
            throw new ConflictException("Authority checkpoint does not match the committed run anchor.");

        return true;
    }

    internal async Task<RunRecord> ExecuteAsync(
        AuthorityPipelineContext context,
        Func<IArchLucidUnitOfWork, CancellationToken, Task> prepare,
        Func<IArchLucidUnitOfWork, CancellationToken, Task<RunRecord>> publish,
        CancellationToken caller)
    {
        if (!integrationOptions.CurrentValue.TransactionalOutboxEnabled &&
            !string.IsNullOrWhiteSpace(integrationOptions.CurrentValue.QueueOrTopicName))
            throw new ConflictException("Authority recovery requires transactional integration publishing.");

        // Identity is pinned to the persisted work payload, not a recalculated or newly licensed input.
        string version = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(
            new { Protocol = 1, Engine = typeof(AuthorityRecoveryPipeline).Module.ModuleVersionId, context.Request },
            AuditJsonSerializationOptions.Instance)));

        bool versioned = options.CurrentValue.EnableDependencyAwareAnalysisReuse && dependencies is not null;
        Dictionary<string, (string Version, string Result)> inputs = new(StringComparer.Ordinal);
        context.RebuildGraphForDependencyChange = versioned;

        foreach (string stage in ResumableStages)
        {
            await ExecuteBoundaryAsync(stage, async (lease, uow, token) =>
            {
                if (stage == AuthorityPipelineStageNames.ContextIngestion)
                {
                    await prepare(uow, token);
                    using IDisposable pins = executor.BeginRecoveryGovernanceScope(context);
                    await executor.ExecuteRecoveryStageAsync(context, stage, token);
                }
                else
                {
                    using IDisposable pins = executor.BeginRecoveryGovernanceScope(context);
                    await executor.ExecuteRecoveryStageAsync(context, stage, token);
                }

                string output = RequireOutput(context.Run, stage);

                if (output.Length == 0)
                    throw new ConflictException($"Authority stage '{stage}' returned without a durable output.");

                EnsureCoverage(stage);
                await VerifyPublicationInputsAsync(stage, uow, token);
                await lease.CompleteAsync(output, uow, token);
                token.ThrowIfCancellationRequested();
                await uow.CommitAsync(token);
            });
        }

        await ExecuteBoundaryAsync(Publish, async (lease, uow, token) =>
        {
            using IDisposable pins = executor.BeginRecoveryGovernanceScope(context);
            await executor.ExecuteRecoveryStageAsync(context, AuthorityPipelineStageNames.Decisioning, token);
            await executor.ExecuteRecoveryStageAsync(context, AuthorityPipelineStageNames.Artifacts, token);
            context.ExecutionBudget!.EnsureCanContinue("authority.finalize");
            await VerifyPublicationInputsAsync(Publish, uow, token);
            await lease.CompleteAsync(context.Run.GoldenManifestId!.Value.ToString("D"), uow, token);
            using IDisposable publication = lease.EnterSqlFence();
            await publish(uow, token);
        });

        return context.Run;

        async Task ExecuteBoundaryAsync(
            string stage, Func<AnalysisRecoveryLease, IArchLucidUnitOfWork, CancellationToken, Task> work)
        {
            AnalysisExecutionBudget budget = context.ExecutionBudget!;
            budget.EnsureCanContinue(stage);
            AnalysisRecoveryStageKey key = Key(context.Scope, context.Run.RunId, stage);
            string stageVersion = await StageVersionAsync(stage, budget.Token);
            AnalysisRecoveryClaim? previous = versioned ? await checkpoints.ReadAsync(key, budget.Token) : null;
            await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(
                checkpoints, key, stageVersion, options.CurrentValue.RecoveryMaxAttempts, clock, budget.Token,
                replaceAuthorityInputs: versioned);
            inputs[stage] = (stageVersion, string.Empty);

            if (lease.IsComplete)
            {
                if (stage == Publish)
                    throw new AnalysisRecoveryLeaseLostException(stage); // Reload the committed header on redelivery.

                if (!string.Equals(lease.Claim.ResultReference, RequireOutput(context.Run, stage), StringComparison.Ordinal))
                    throw new AnalysisRecoveryLeaseLostException(stage); // Another worker committed after our header read.

                bool hydrated = await budget.ExecuteAsync($"authority.{stage}",
                    token => executor.HydrateRecoveryStageAsync(context, stage, token), budget.Token);

                if (versioned && AnalysisDependencyFingerprint.Rejection(lease.Claim, stageVersion, hydrated, true) is { } reason)
                    throw new AnalysisDependencyRejectionException(stage, reason);

                if (!hydrated)
                    throw new ConflictException($"The saved Authority output for stage '{stage}' is missing.");

                EnsureCoverage(stage);
                inputs[stage] = (stageVersion, lease.Claim.ResultReference!);
                logger.LogInformation("Reused Authority analysis checkpoint. RunId={RunId} Stage={Stage}",
                    context.Run.RunId, stage);

                return;
            }

            if (versioned)
            {
                logger.LogInformation("Authority stage recomputation. RunId={RunId} Stage={Stage} Reason={Reason}",
                    context.Run.RunId, stage,
                    previous is null ? "checkpoint_missing" : previous.InputVersion != stageVersion
                        ? "stale_dependencies" : "checkpoint_not_successful");
            }

            try
            {
                await using IArchLucidUnitOfWork uow = await transactions.CreateAsync(lease.Token);
                context.RecoveryUnitOfWork = uow;
                await work(lease, uow, lease.Token);

                if (stage != Publish)
                    inputs[stage] = (stageVersion, RequireOutput(context.Run, stage));
            }
            catch (Exception ex)
            {
                bool interrupted = caller.IsCancellationRequested;
                Exception outcome = !budget.IsExpired && !interrupted && lease.Token.IsCancellationRequested
                    ? new AnalysisRecoveryLeaseLostException(stage) : ex;

                try
                {
                    await lease.ReleaseAfterFailureAsync(outcome, interrupted);
                }
                catch (Exception releaseFailure)
                {
                    logger.LogWarning(releaseFailure, "Authority claim cleanup deferred until lease expiry. Stage={Stage}", stage);
                }

                if (!ReferenceEquals(outcome, ex))
                    throw outcome;

                throw;
            }
            finally
            {
                context.RecoveryUnitOfWork = null;
            }
        }

        async Task<string> StageVersionAsync(string stage, CancellationToken token)
        {
            if (!versioned)
            {
                return stage == AuthorityPipelineStageNames.ContextIngestion
                ? version
                : Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(new
                {
                    RequestVersion = version,
                    context.Run.PinnedPolicyPackIdsHashSha256,
                    context.Run.PinnedEvidencePackagePinsHashSha256,
                    context.Run.PinnedArchitectureVersionContentHashSha256,
                    context.Run.PinnedKnowledgeModelContentHashSha256
                }, AuditJsonSerializationOptions.Instance)));
            }

            var run = context.Run;
            string effective = await dependencies!.ForAuthorityAsync(stage, context, token);
            string[] prerequisites = stage switch
            {
                AuthorityPipelineStageNames.Graph => [AuthorityPipelineStageNames.ContextIngestion],
                AuthorityPipelineStageNames.Findings => [AuthorityPipelineStageNames.ContextIngestion, AuthorityPipelineStageNames.Graph],
                Publish => ResumableStages,
                _ => []
            };

            return AnalysisDependencyFingerprint.Create(ProjectScopeKey.From(context.Scope), stage,
                version, effective, stage == AuthorityPipelineStageNames.ContextIngestion ? null : new
                {
                    run.PinnedPolicyPackIdsHashSha256, run.PinnedEvidencePackagePinsHashSha256,
                    run.PinnedArchitectureVersionContentHashSha256, run.PinnedKnowledgeModelContentHashSha256,
                    run.EngineProvenanceJson
                }, prerequisites.Select(name => new { Name = name, inputs[name].Version, inputs[name].Result }).ToArray());
        }

        void EnsureCoverage(string stage)
        {
            if (versioned && stage == AuthorityPipelineStageNames.Findings &&
                context.FindingsSnapshot?.GenerationStatus != FindingsSnapshotGenerationStatus.Complete)
                throw new AnalysisDependencyRejectionException(stage, "incomplete_findings");
        }

        async Task VerifyPublicationInputsAsync(string stage, IArchLucidUnitOfWork uow, CancellationToken token)
        {
            if (!versioned)
                return;

            foreach (var (name, binding) in inputs)
            {
                // Recheck the effective inputs and lock the persisted upstream result until this commit.

                if (binding.Version != await StageVersionAsync(name, token))
                    throw new AnalysisDependencyRejectionException(stage, "inputs_changed_during_execution");

                if (name != stage && !await checkpoints.IsCurrentAsync(
                    Key(context.Scope, context.Run.RunId, name), binding.Version, binding.Result, uow, token))
                    throw new AnalysisDependencyRejectionException(stage, "upstream_changed_during_execution");
            }
        }
    }

    internal async Task MaterializeHandoffAsync(
        ScopeContext scope, RunRecord run, Func<IArchLucidUnitOfWork?, CancellationToken, Task> materialize, CancellationToken ct)
    {
        if (!options.CurrentValue.EnableDurableAuthorityRecovery || !await IsPublishedAsync(scope, run, ct))
        {
            await materialize(null, ct);

            return;
        }

        string manifest = run.GoldenManifestId!.Value.ToString("D");
        string version = Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(manifest)));
        AnalysisStageExecutionOptions policy = options.CurrentValue;
        using AnalysisExecutionBudget budget = new(policy, clock, policy.GetStageTimeout("authority.agent_handoff"), ct);
        await using AnalysisRecoveryLease lease = await AnalysisRecoveryLease.AcquireAsync(
            checkpoints, Key(scope, run.RunId, "agent_handoff"), version, policy.RecoveryMaxAttempts, clock, budget.Token);

        if (lease.IsComplete)
            return;

        try
        {
            await using IArchLucidUnitOfWork uow = await transactions.CreateAsync(lease.Token);
            await materialize(uow, lease.Token);
            await lease.CompleteAsync(manifest, uow, lease.Token);
            lease.Token.ThrowIfCancellationRequested();
            await uow.CommitAsync(lease.Token);
        }
        catch (Exception ex)
        {
            try
            {
                await lease.ReleaseAfterFailureAsync(ex, !budget.IsExpired &&
                    (ct.IsCancellationRequested || lease.Token.IsCancellationRequested));
            }
            catch (Exception cleanup)
            {
                logger.LogWarning(cleanup, "Authority handoff claim cleanup deferred until lease expiry.");
            }

            throw;
        }
    }

    internal static AnalysisRecoveryStageKey Key(ScopeContext scope, Guid runId, string stage) =>
        new(ProjectScopeKey.From(scope), Pipeline, runId, stage);

    private static string RequireOutput(RunRecord run, string stage)
    {
        Guid? id = stage switch
        {
            AuthorityPipelineStageNames.ContextIngestion => run.ContextSnapshotId,
            AuthorityPipelineStageNames.Graph => run.GraphSnapshotId,
            AuthorityPipelineStageNames.Findings => run.FindingsSnapshotId,
            _ => throw new ArgumentOutOfRangeException(nameof(stage))
        };

        return id is Guid output && output != Guid.Empty ? output.ToString("D") : string.Empty;
    }
}
