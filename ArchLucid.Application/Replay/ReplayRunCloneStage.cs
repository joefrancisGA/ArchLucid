using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Replay;

/// <inheritdoc cref="IReplayRunCloneStage" />
public sealed class ReplayRunCloneStage : IReplayRunCloneStage
{
    /// <inheritdoc />
    public AgentEvidencePackage CloneEvidenceForReplay(AgentEvidencePackage original, string replayRunId)
    {
        ArgumentNullException.ThrowIfNull(original);
        ArgumentException.ThrowIfNullOrWhiteSpace(replayRunId);

        if (string.IsNullOrWhiteSpace(original.RunId))
        {
            throw new ConflictException(
                "Replay clone blocked: source evidence package is missing a source run header binding.");
        }

        return new AgentEvidencePackage
        {
            EvidencePackageId = Guid.NewGuid().ToString("N"),
            RunId = replayRunId,
            RequestId = original.RequestId,
            SystemName = original.SystemName,
            Environment = original.Environment,
            CloudProvider = original.CloudProvider,
            Request =
                new RequestEvidence
                {
                    Description = original.Request.Description,
                    Constraints = original.Request.Constraints.ToList(),
                    RequiredCapabilities = original.Request.RequiredCapabilities.ToList(),
                    Assumptions = original.Request.Assumptions.ToList()
                },
            Policies =
                original.Policies.Select(p => new PolicyEvidence
                {
                    PolicyId = p.PolicyId,
                    Title = p.Title,
                    Summary = p.Summary,
                    RequiredControls = p.RequiredControls.ToList(),
                    Tags = p.Tags.ToList()
                }).ToList(),
            ServiceCatalog =
                original.ServiceCatalog.Select(s => new ServiceCatalogEvidence
                {
                    ServiceId = s.ServiceId,
                    ServiceName = s.ServiceName,
                    Category = s.Category,
                    Summary = s.Summary,
                    Tags = s.Tags.ToList(),
                    RecommendedUseCases = s.RecommendedUseCases.ToList()
                }).ToList(),
            Patterns =
                original.Patterns.Select(p => new PatternEvidence
                {
                    PatternId = p.PatternId,
                    Name = p.Name,
                    Summary = p.Summary,
                    ApplicableCapabilities = p.ApplicableCapabilities.ToList(),
                    SuggestedServices = p.SuggestedServices.ToList()
                }).ToList(),
            PriorManifest = original.PriorManifest is null
                ? null
                : new PriorManifestEvidence
                {
                    ManifestVersion = original.PriorManifest.ManifestVersion,
                    Summary = original.PriorManifest.Summary,
                    ExistingServices = original.PriorManifest.ExistingServices.ToList(),
                    ExistingDatastores = original.PriorManifest.ExistingDatastores.ToList(),
                    ExistingRequiredControls = original.PriorManifest.ExistingRequiredControls.ToList()
                },
            Notes = original.Notes.Select(n => new EvidenceNote { NoteType = n.NoteType, Message = n.Message }).ToList(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }

    /// <inheritdoc />
    public List<AgentTask> CloneTasksForReplay(IReadOnlyList<AgentTask> tasks, string replayRunId)
    {
        ArgumentNullException.ThrowIfNull(tasks);
        ArgumentException.ThrowIfNullOrWhiteSpace(replayRunId);

        return tasks.Select(t => new AgentTask
        {
            TaskId = Guid.NewGuid().ToString("N"),
            RunId = replayRunId,
            AgentType = t.AgentType,
            Objective = t.Objective,
            Status = AgentTaskStatus.Created,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CompletedUtc = null,
            EvidenceBundleRef = t.EvidenceBundleRef,
            AllowedTools = t.AllowedTools.ToList(),
            AllowedSources = t.AllowedSources.ToList()
        }).ToList();
    }

    /// <inheritdoc />
    public string BuildReplayManifestVersion(string? currentManifestVersion)
    {
        return string.IsNullOrWhiteSpace(currentManifestVersion) ? "v1-replay" : $"{currentManifestVersion}-replay";
    }
}
