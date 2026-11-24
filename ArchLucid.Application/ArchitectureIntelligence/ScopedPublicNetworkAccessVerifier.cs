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

    internal async Task<PublicNetworkAccessVerification> VerifyAsync(
        string tenantId, string? workspaceId, string? projectId, string runId, Guid resourceId,
        CancellationToken cancellationToken)
    {
        PublicNetworkAccessVerification unverified = new(resourceId, PublicNetworkAccessVerificationOutcome.Unverified);
        if (scopeProvider is null || actorContext is null || runs is null ||
            shares is null || bindings is null || snapshots is null || resourceId == Guid.Empty ||
            !Guid.TryParse(runId, out Guid runGuid) || runGuid == Guid.Empty ||
            !Guid.TryParse(tenantId, out Guid tenant) || tenant == Guid.Empty ||
            !Guid.TryParse(workspaceId, out Guid workspace) || workspace == Guid.Empty ||
            !Guid.TryParse(projectId, out Guid project) || project == Guid.Empty)
            return unverified;

        ScopeContext scope = scopeProvider.GetCurrentScope();
        string? actor = actorContext.GetActorId();
        if (string.IsNullOrWhiteSpace(actor) || scope.TenantId != tenant ||
            scope.WorkspaceId != workspace || scope.ProjectId != project)
            return unverified;

        ScopeContext evidenceScope = new() { TenantId = tenant, WorkspaceId = workspace, ProjectId = project };
        RunRecord? run = await runs.GetByIdAsync(evidenceScope, runGuid, cancellationToken);
        if (run?.ArchitectureId is not Guid architectureId || architectureId == Guid.Empty ||
            run.RunId != runGuid || run.TenantId != tenant || run.WorkspaceId != workspace || run.ScopeProjectId != project)
            return unverified;

        // The closed-loop endpoint requires ExecuteAuthority. Apply the current architecture share
        // restriction as well before reading its inventory binding or any evidence.
        ArchitectureShareAccessEvaluation access = await shares.EvaluateAsync(
            evidenceScope, architectureId, actor, hasReadAuthority: true,
            hasExecuteAuthority: false, hasWorkspaceAdminAuthority: false, cancellationToken: cancellationToken);
        if (!access.ArchitectureFound || !access.CanRead)
            return unverified;

        var binding = await bindings.TryGetBindingAsync(evidenceScope, architectureId, cancellationToken);
        if (binding is not { IsBound: true, SnapshotId: Guid snapshotId } ||
            binding.ArchitectureId != architectureId || snapshotId == Guid.Empty)
            return unverified;

        return await InventoryPublicNetworkAccessVerifier.VerifyAsync(
            snapshots, evidenceScope, snapshotId, resourceId, clock ?? TimeProvider.System, cancellationToken);
    }
}
