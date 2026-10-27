using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunEngineProvenanceApplicatorTests
{
    private const string AliasId = "premium-assurance";

    [Fact]
    public void TryApplyFromEffectiveAliasId_trims_surrounding_whitespace_on_alias_id()
    {
        StubAliasRegistry registry = new(AliasId);
        RunRecord run = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CreatedUtc = new DateTime(2026, 8, 13, 12, 0, 0, DateTimeKind.Utc),
        };

        RunEngineProvenanceApplicator.TryApplyFromEffectiveAliasId(
            run,
            $"  {AliasId}  ",
            registry);

        run.EngineProvenanceJson.Should().NotBeNullOrWhiteSpace();

        ReviewRunEngineProvenance? provenance =
            ReviewRunEngineProvenanceJson.TryDeserialize(run.EngineProvenanceJson);

        provenance.Should().NotBeNull();
        provenance!.ModelAliasId.Should().Be(AliasId);
    }

    private sealed class StubAliasRegistry(string aliasId) : IAgentModelAliasRegistry
    {
        public IReadOnlyCollection<AgentModelAliasRegistryEntry> ListEntries() =>
        [
            new AgentModelAliasRegistryEntry
            {
                AliasId = aliasId,
                ProviderConnectionKind = AgentModelAliasProviderKinds.ArchLucidManagedAzureOpenAi,
                DeploymentName = "gpt-4o",
                CapabilityTags = [],
                ApprovedTaskTypes = [],
            },
        ];

        public AgentModelAliasRegistryEntry GetRequired(string id) =>
            ListEntries().Single(entry => string.Equals(entry.AliasId, id, StringComparison.Ordinal));

        public bool TryGet(string id, out AgentModelAliasRegistryEntry? entry)
        {
            entry = ListEntries()
                .SingleOrDefault(entry => string.Equals(entry.AliasId, id, StringComparison.Ordinal));

            return entry is not null;
        }

        public string ResolveAliasIdForTier(LlmModelTier tier) => aliasId;
    }
}
