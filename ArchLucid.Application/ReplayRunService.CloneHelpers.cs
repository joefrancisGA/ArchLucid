using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application;

public sealed partial class ReplayRunService
{
    /// <summary>
    ///     Creates a deep copy of <paramref name = "original"/> bound to <paramref name = "replayRunId"/>.
    ///     A clone is required so the replay run's evidence is isolated from the original run's mutable
    ///     collections — shared references would corrupt both runs if either were mutated.
    /// </summary>
    private static AgentEvidencePackage CloneEvidenceForReplay(AgentEvidencePackage original, string replayRunId)
    {
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

    /// <summary>
    ///     Derives a replay manifest version by appending <c>-replay</c> to the current version,
    ///     or returns <c>v1-replay</c> when no current version exists.
    /// </summary>
    private static string BuildReplayManifestVersion(string? currentManifestVersion)
    {
        return string.IsNullOrWhiteSpace(currentManifestVersion) ? "v1-replay" : $"{currentManifestVersion}-replay";
    }
}
