using System.Text.Json;

using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Persistence.Governance;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// FsCheck properties for <see cref="EffectiveGovernanceResolver"/> (determinism on a fixed empty catalog).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EffectiveGovernanceResolverPropertyTests
{
    [Property(MaxTest = 80)]
    public Property ResolveAsync_twice_produces_identical_json_on_empty_stores()
    {
        return Prop.ForAll(
            Arb.Default.Guid(),
            Arb.Default.Guid(),
            Arb.Default.Guid(),
            (tenantId, workspaceId, projectId) =>
            {
                InMemoryPolicyPackRepository packRepo = new();
                InMemoryPolicyPackVersionRepository versionRepo = new();
                InMemoryPolicyPackAssignmentRepository assignmentRepo = new();
                EffectiveGovernanceResolver resolver = new(assignmentRepo, packRepo, versionRepo);

                EffectiveGovernanceResolutionResult first = resolver
                    .ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                EffectiveGovernanceResolutionResult second = resolver
                    .ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None)
                    .GetAwaiter()
                    .GetResult();

                JsonSerializerOptions options = PolicyPackJsonSerializerOptions.Default;
                string jsonA = JsonSerializer.Serialize(first, options);
                string jsonB = JsonSerializer.Serialize(second, options);

                return jsonA == jsonB;
            });
    }
}
