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
    private static readonly DateTime EvaluationAt = new(2026, 8, 12, 10, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void TryApplyFromEffectiveAliasId_preserves_selection_time_provenance()
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
        provenance.RunTimestampUtc.Should().Be(new DateTime(2026, 8, 13, 12, 0, 0, DateTimeKind.Utc));

        IReadOnlyList<ReviewRunEngineTaskEvaluationSnapshot> snapshots = provenance.TaskEvaluationSnapshotsAtSelection!;
        snapshots.Select(snapshot => snapshot.TaskType).Should().Equal("classify", "score");
        snapshots[0].EvaluationState.Should().Be("Evaluated");
        snapshots[0].EvaluatedUtc.Should().Be(EvaluationAt);
        snapshots[1].EvaluationState.Should().Be("NotEvaluated");
        snapshots[1].EvaluatedUtc.Should().BeNull();
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
                TaskEvaluations =
                [
                    new AgentModelCatalogEvaluationRow { TaskType = "score" },
                    new AgentModelCatalogEvaluationRow
                    {
                        TaskType = "classify",
                        EvaluationState = AgentModelEvaluationStateKind.Evaluated,
                        EvaluatedUtc = EvaluationAt,
                    },
                ],
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
