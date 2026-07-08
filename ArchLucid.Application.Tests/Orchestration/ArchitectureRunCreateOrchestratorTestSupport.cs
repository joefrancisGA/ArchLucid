using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Persistence.Governance;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Orchestration;

internal static class ArchitectureRunCreateOrchestratorTestSupport
{
    internal static DefaultPolicyPackCloudBaselineApplicator CreatePolicyPackCloudBaselineApplicator() =>
        new(
            new InMemoryPolicyPackRepository(),
            new InMemoryPolicyPackAssignmentRepository(),
            NullLogger<DefaultPolicyPackCloudBaselineApplicator>.Instance);
}
