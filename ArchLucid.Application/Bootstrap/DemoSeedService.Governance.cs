using System.Text.Json;
using System.Threading;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap;

/// <summary>
///     Governance workflow fixtures for the baseline: approval request, promotion record, and environment
///     activations, each stamped with the seeding scope.
/// </summary>
public sealed partial class DemoSeedService
{
    private async Task EnsureGovernanceAsync(ContosoRetailDemoIds demo, CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (await approvalRepository.GetByIdAsync(demo.ApprovalRequest, cancellationToken) is null)
        {
            GovernanceApprovalRequest approval = new()
            {
                ApprovalRequestId = demo.ApprovalRequest,
                RunId = demo.RunHardened,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                Status = GovernanceApprovalStatus.Approved,
                RequestedBy = "demo.architect@example.com",
                ReviewedBy = "demo.reviewer@example.com",
                RequestComment = "Promote hardened retail manifest to test for integration validation.",
                ReviewComment = "Approved — controls and WAF requirements satisfied in manifest.",
                RequestedUtc = DemoUtc,
                ReviewedUtc = DemoUtc.AddHours(2)
            };
            StampGovernanceScope(scope, approval);
            await approvalRepository.CreateAsync(approval, cancellationToken);
        }

        IReadOnlyList<GovernancePromotionRecord> promos = await promotionRepository.GetByRunIdAsync(demo.RunHardened, cancellationToken);

        if (promos.All(p => p.PromotionRecordId != demo.PromotionRecord))
        {
            GovernancePromotionRecord promotion = new()
            {
                PromotionRecordId = demo.PromotionRecord,
                RunId = demo.RunHardened,
                ManifestVersion = demo.ManifestHardened,
                SourceEnvironment = GovernanceEnvironment.Dev,
                TargetEnvironment = GovernanceEnvironment.Test,
                PromotedBy = "demo.release@example.com",
                PromotedUtc = DemoUtc.AddHours(3),
                ApprovalRequestId = demo.ApprovalRequest,
                Notes = "Demo promotion after approval (trusted baseline seed)."
            };
            StampGovernanceScope(scope, promotion);
            await promotionRepository.CreateAsync(promotion, cancellationToken);
        }

        await EnsureActivationAsync(scope, demo.ActivationDev, demo.RunBaseline, demo.ManifestBaseline, GovernanceEnvironment.Dev, cancellationToken);
        await EnsureActivationAsync(scope, demo.ActivationTest, demo.RunHardened, demo.ManifestHardened, GovernanceEnvironment.Test, cancellationToken);
    }

    private async Task EnsureActivationAsync(ScopeContext scope, string activationId, string runId, string manifestVersion, string environment,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<GovernanceEnvironmentActivation> rows = await activationRepository.GetByEnvironmentAsync(environment, cancellationToken);

        if (rows.Any(r => r.ActivationId == activationId))
            return;
        GovernanceEnvironmentActivation activation = new()
        {
            ActivationId = activationId,
            RunId = runId,
            ManifestVersion = manifestVersion,
            Environment = environment,
            IsActive = true,
            ActivatedUtc = DemoUtc
        };
        StampGovernanceScope(scope, activation);
        await activationRepository.CreateAsync(activation, cancellationToken);
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernanceApprovalRequest row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernancePromotionRecord row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }

    private static void StampGovernanceScope(ScopeContext scope, GovernanceEnvironmentActivation row)
    {
        if (scope.TenantId == Guid.Empty)
            return;
        row.TenantId = scope.TenantId;
        row.WorkspaceId = scope.WorkspaceId;
        row.ProjectId = scope.ProjectId;
    }
}
