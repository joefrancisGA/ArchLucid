using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Governance.PolicyPacks.Stages;
using ArchLucid.Decisioning.Governance.Resolution;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Composes <see cref="PolicyPackManagementService" /> stage handlers for tests and manual wiring.</summary>
public static class PolicyPackManagementServiceComposer
{
    public static PolicyPackManagementService Compose(
        IPolicyPackRepository packRepository,
        IPolicyPackVersionRepository versionRepository,
        IPolicyPackAssignmentRepository assignmentRepository,
        IPolicyPackChangeLogRepository changeLogRepository,
        IArchLucidUnitOfWorkFactory unitOfWorkFactory,
        IPolicyPackResolverCacheInvalidator policyPackResolverCacheInvalidator,
        ILogger<PolicyPackChangeLogAppender>? changeLogLogger = null)
    {
        PolicyPackChangeLogAppender changeLogAppender = new(
            changeLogRepository,
            changeLogLogger ?? NullLogger<PolicyPackChangeLogAppender>.Instance);

        IPolicyPackCreateStage createStage = new PolicyPackCreateStage(
            packRepository,
            versionRepository,
            unitOfWorkFactory,
            changeLogAppender);

        IPolicyPackPublishStage publishStage = new PolicyPackPublishStage(
            packRepository,
            versionRepository,
            policyPackResolverCacheInvalidator,
            changeLogAppender);

        IPolicyPackAssignStage assignStage = new PolicyPackAssignStage(
            assignmentRepository,
            policyPackResolverCacheInvalidator,
            changeLogAppender);

        return new PolicyPackManagementService(createStage, publishStage, assignStage);
    }
}
