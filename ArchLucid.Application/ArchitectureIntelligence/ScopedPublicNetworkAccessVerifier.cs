using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Checks one explicit Azure setting in the current architecture-bound inventory.</summary>
public sealed class ScopedPublicNetworkAccessVerifier(
    IScopeContextProvider? scopeProvider = null,
    IActorContext? actorContext = null,
    IRunRepository? runs = null,
    IArchitectureShareAccessService? shares = null,
    IArchitectureInventoryBindingService? bindings = null,
    IAzureInventorySnapshotRepository? snapshots = null,
    TimeProvider? clock = null)
{
    internal const string ResourceProperty = "architectureIntelligence.publicNetworkAccessResourceId";
    internal const string SnapshotProperty = "architectureIntelligence.publicNetworkAccessSnapshotId";
    internal const string Rationale = "The scoped Azure inventory records the publicNetworkAccess setting for this resource.";

    internal static string Title(Guid id) => $"Public network access is disabled for Azure resource {id:D}";

    internal const string StorageTlsResourceProperty = "architectureIntelligence.storageMinimumTls12ResourceId";
    internal const string StorageTlsSnapshotProperty = "architectureIntelligence.storageMinimumTlsSnapshotId";
    internal const string StorageTlsRationale =
        "The authorized Azure Storage inventory records the configured minimum TLS version, not observed protocol enforcement.";

    internal static string StorageTlsTitle(Guid id) => $"Azure Storage {id:D} is configured with minimum TLS 1.2";

    internal async Task<PublicNetworkAccessVerification> VerifyAsync(
        string tenantId, string? workspaceId, string? projectId, string runId, Guid resourceId,
        CancellationToken cancellationToken)
    {
        if (resourceId != Guid.Empty && snapshots is not null &&
            await ResolveSnapshotAsync(tenantId, workspaceId, projectId, runId, cancellationToken) is { } binding)
        {
            return await InventoryPublicNetworkAccessVerifier.VerifyAsync(
                snapshots, binding.Scope, binding.SnapshotId, resourceId, clock ?? TimeProvider.System, cancellationToken);
        }

        return new(resourceId, PublicNetworkAccessVerificationOutcome.Unverified);
    }

    internal async Task<StorageMinimumTlsVerification> VerifyStorageTlsAsync(
        string tenantId, string? workspaceId, string? projectId, string runId, Guid resourceId,
        CancellationToken cancellationToken)
    {
        if (resourceId != Guid.Empty && snapshots is not null &&
            await ResolveSnapshotAsync(tenantId, workspaceId, projectId, runId, cancellationToken) is { } binding)
        {
            return await InventoryStorageMinimumTlsVerifier.VerifyAsync(
                snapshots, binding.Scope, binding.SnapshotId, resourceId, clock ?? TimeProvider.System, cancellationToken);
        }

        return new(resourceId, StorageMinimumTlsOutcome.Unverified);
    }

    private async Task<(ScopeContext Scope, Guid SnapshotId)?> ResolveSnapshotAsync(
        string tenantId, string? workspaceId, string? projectId, string runId, CancellationToken cancellationToken)
    {
        if (scopeProvider is null || actorContext is null || runs is null ||
            shares is null || bindings is null || snapshots is null ||
            !Guid.TryParse(runId, out Guid runGuid) || runGuid == Guid.Empty ||
            !Guid.TryParse(tenantId, out Guid tenant) || tenant == Guid.Empty ||
            !Guid.TryParse(workspaceId, out Guid workspace) || workspace == Guid.Empty ||
            !Guid.TryParse(projectId, out Guid project) || project == Guid.Empty)
            return null;

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string? actor = actorContext.GetActorId();
        if (string.IsNullOrWhiteSpace(actor) || scope.TenantId != tenant ||
            scope.WorkspaceId != workspace || scope.ProjectId != project)
            return null;

        ScopeContext evidenceScope = new() { TenantId = tenant, WorkspaceId = workspace, ProjectId = project };
        RunRecord? run = await runs.GetByIdAsync(evidenceScope, runGuid, cancellationToken);
        if (run?.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty ||
            run.RunId != runGuid || run.TenantId != tenant || run.WorkspaceId != workspace || run.ScopeProjectId != project)
            return null;

        // The closed-loop endpoint requires ExecuteAuthority. Apply the current architecture share
        // restriction as well before reading its inventory binding or any evidence.
        ArchitectureShareAccessEvaluation access = await shares.EvaluateAsync(
            evidenceScope, architectureId, actor, hasReadAuthority: true,
            hasExecuteAuthority: false, hasWorkspaceAdminAuthority: false, cancellationToken: cancellationToken);
        if (!access.ArchitectureFound || !access.CanRead)
            return null;

        var binding = await bindings.TryGetBindingAsync(evidenceScope, architectureId, cancellationToken);
        if (binding is not { IsBound: true, SnapshotId: Guid snapshotId } ||
            binding.ArchitectureId != architectureId || snapshotId == Guid.Empty)
            return null;

        return (evidenceScope, snapshotId);
    }
}
