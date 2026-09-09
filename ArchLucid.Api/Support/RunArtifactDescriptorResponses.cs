using ArchLucid.Api.Contracts;
using ArchLucid.Contracts.Persistence.Artifacts;

namespace ArchLucid.Api.Support;

internal static class RunArtifactDescriptorResponses
{
    internal static List<ArtifactDescriptorResponse> MergeForRun(
        Guid manifestId,
        Guid runId,
        IReadOnlyList<ArtifactDescriptor> synthesizedArtifacts,
        IReadOnlyList<ArtifactDescriptor> verificationReportArtifacts)
    {
        List<ArtifactDescriptorResponse> responses = synthesizedArtifacts
            .Select(artifact => ArtifactDescriptorResponse.From(artifact, manifestId))
            .ToList();

        foreach (ArtifactDescriptor artifact in verificationReportArtifacts)
        {
            ArtifactDescriptorResponse response = ArtifactDescriptorResponse.From(artifact, manifestId);
            response.RunId = runId;
            responses.Add(response);
        }

        return responses
            .OrderBy(response => response.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(response => response.ArtifactId)
            .ToList();
    }
}
