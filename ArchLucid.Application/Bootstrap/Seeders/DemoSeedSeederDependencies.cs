using ArchLucid.Application.Authority;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>Shared persistence and audit dependencies for demo scenario seeders.</summary>
public sealed class DemoSeedSeederDependencies(
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IAgentTaskRepository taskRepository,
    IAgentResultRepository resultRepository,
    IAuthorityCommittedManifestChainWriter authorityCommittedManifestChainWriter,
    IOptionsMonitor<DemoOptions> demoOptions,
    IGovernanceApprovalRequestRepository approvalRepository,
    IGovernancePromotionRecordRepository promotionRepository,
    IGovernanceEnvironmentActivationRepository activationRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IArtifactBundleRepository artifactBundleRepository,
    IAuditService auditService,
    IActorContext actorContext,
    ILogger logger)
{
    public IArchitectureRequestRepository RequestRepository { get; } =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    public IRunRepository RunRepository { get; } =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    public IScopeContextProvider ScopeContextProvider { get; } =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public IAgentTaskRepository TaskRepository { get; } =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    public IAgentResultRepository ResultRepository { get; } =
        resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));

    public IAuthorityCommittedManifestChainWriter AuthorityCommittedManifestChainWriter { get; } =
        authorityCommittedManifestChainWriter
        ?? throw new ArgumentNullException(nameof(authorityCommittedManifestChainWriter));

    public IOptionsMonitor<DemoOptions> DemoOptions { get; } =
        demoOptions ?? throw new ArgumentNullException(nameof(demoOptions));

    public IGovernanceApprovalRequestRepository ApprovalRepository { get; } =
        approvalRepository ?? throw new ArgumentNullException(nameof(approvalRepository));

    public IGovernancePromotionRecordRepository PromotionRepository { get; } =
        promotionRepository ?? throw new ArgumentNullException(nameof(promotionRepository));

    public IGovernanceEnvironmentActivationRepository ActivationRepository { get; } =
        activationRepository ?? throw new ArgumentNullException(nameof(activationRepository));

    public IRunExportRecordRepository RunExportRecordRepository { get; } =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    public IArtifactBundleRepository ArtifactBundleRepository { get; } =
        artifactBundleRepository ?? throw new ArgumentNullException(nameof(artifactBundleRepository));

    public IAuditService AuditService { get; } =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public IActorContext ActorContext { get; } =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    public ILogger Logger { get; } = logger ?? throw new ArgumentNullException(nameof(logger));
}
