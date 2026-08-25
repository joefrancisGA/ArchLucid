using ArchLucid.Application.Tests.Architecture;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class ArchitectureRunCreateOrchestratorTestSupport
{
    internal static DefaultPolicyPackCloudBaselineApplicator CreatePolicyPackCloudBaselineApplicator() =>
        new(
            new InMemoryPolicyPackRepository(),
            new InMemoryPolicyPackAssignmentRepository(),
            NullLogger<DefaultPolicyPackCloudBaselineApplicator>.Instance);

    internal static ArchitectureRunCreateOrchestrator CreateOrchestrator(
        IArchitectureRunAuthorityCoordination coordination,
        IArchitectureRequestRepository? requestRepository = null,
        IRunRepository? runRepository = null,
        IScopeContextProvider? scopeContextProvider = null,
        IEvidenceBundleRepository? evidenceBundleRepository = null,
        IAgentTaskRepository? taskRepository = null,
        IArchitectureRunIdempotencyRepository? architectureRunIdempotencyRepository = null,
        IActorContext? actorContext = null,
        IBaselineMutationAuditService? baselineMutationAudit = null,
        IArchLucidUnitOfWorkFactory? unitOfWorkFactory = null,
        IDistributedCreateRunIdempotencyLock? distributedCreateRunIdempotencyLock = null,
        IOptions<ArchitectureRunCreateOptions>? createRunOptions = null,
        IAsyncAuthorityPipelineModeResolver? asyncAuthorityPipelineModeResolver = null,
        IRunStateTransitionService? runStateTransitionService = null,
        IRequestContentSafetyPrecheck? requestContentSafetyPrecheck = null,
        IWorkspaceSystemNameCollisionGuard? workspaceSystemNameCollisionGuard = null,
        IAuditService? auditService = null,
        IUsageMeteringService? usageMetering = null,
        TimeProvider? timeProvider = null,
        DefaultPolicyPackCloudBaselineApplicator? defaultPolicyPackCloudBaselineApplicator = null,
        IArchitectureIdentityService? architectureIdentityService = null)
    {
        requestRepository ??= Mock.Of<IArchitectureRequestRepository>();
        runRepository ??= Mock.Of<IRunRepository>();
        scopeContextProvider ??= Mock.Of<IScopeContextProvider>();
        evidenceBundleRepository ??= Mock.Of<IEvidenceBundleRepository>();
        taskRepository ??= Mock.Of<IAgentTaskRepository>();
        architectureRunIdempotencyRepository ??= Mock.Of<IArchitectureRunIdempotencyRepository>();
        actorContext ??= Mock.Of<IActorContext>();
        baselineMutationAudit ??= Mock.Of<IBaselineMutationAuditService>();
        unitOfWorkFactory ??= ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();
        distributedCreateRunIdempotencyLock ??= new InProcessCreateRunIdempotencyLock();
        createRunOptions ??= Options.Create(new ArchitectureRunCreateOptions());
        asyncAuthorityPipelineModeResolver ??= new DisabledAsyncAuthorityPipelineModeResolver();
        runStateTransitionService ??= Mock.Of<IRunStateTransitionService>();
        requestContentSafetyPrecheck ??= new DefaultRequestContentSafetyPrecheck();
        workspaceSystemNameCollisionGuard ??= WorkspaceSystemNameCollisionGuardTestDoubles.NoOp();
        auditService ??= Mock.Of<IAuditService>();
        usageMetering ??= Mock.Of<IUsageMeteringService>();
        timeProvider ??= TimeProvider.System;
        defaultPolicyPackCloudBaselineApplicator ??= CreatePolicyPackCloudBaselineApplicator();
        architectureIdentityService ??= Mock.Of<IArchitectureIdentityService>();

        TimeProvider resolvedTimeProvider = timeProvider;
        IOptions<ArchitectureRunCreateOptions> resolvedCreateRunOptions = createRunOptions;

        ArchitectureRunCreateIdempotencyHelper idempotencyHelper = new(
            architectureRunIdempotencyRepository,
            runRepository,
            scopeContextProvider,
            taskRepository,
            evidenceBundleRepository,
            resolvedCreateRunOptions,
            resolvedTimeProvider,
            NullLogger<ArchitectureRunCreateIdempotencyHelper>.Instance);

        ArchitectureRunCreatePersistenceHelper persistenceHelper = new(
            requestRepository,
            evidenceBundleRepository,
            taskRepository,
            architectureRunIdempotencyRepository,
            runRepository,
            scopeContextProvider,
            runStateTransitionService,
            NullLogger<ArchitectureRunCreatePersistenceHelper>.Instance);

        ArchitectureRunCreatePostCreateHooks postCreateHooks = new(
            auditService,
            scopeContextProvider,
            usageMetering,
            resolvedTimeProvider,
            defaultPolicyPackCloudBaselineApplicator,
            architectureIdentityService,
            NullLogger<ArchitectureRunCreatePostCreateHooks>.Instance);

        return new ArchitectureRunCreateOrchestrator(
            coordination,
            requestRepository,
            runRepository,
            scopeContextProvider,
            evidenceBundleRepository,
            taskRepository,
            architectureRunIdempotencyRepository,
            actorContext,
            baselineMutationAudit,
            unitOfWorkFactory,
            distributedCreateRunIdempotencyLock,
            resolvedCreateRunOptions,
            asyncAuthorityPipelineModeResolver,
            runStateTransitionService,
            requestContentSafetyPrecheck,
            workspaceSystemNameCollisionGuard,
            idempotencyHelper,
            persistenceHelper,
            postCreateHooks,
            resolvedTimeProvider,
            NullLogger<ArchitectureRunCreateOrchestrator>.Instance);
    }
}
