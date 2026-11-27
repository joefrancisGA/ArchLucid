using ArchLucid.Core.Http;

namespace ArchLucid.Application.CloudExtractor;

/// <summary>Formats the shared outbound deadline for hosted collection callers.</summary>
internal static class HostedCloudCollectionDeadline
{
    public static string FailureDetail(OutboundOperationDeadline deadline, string provider) =>
        $"Hosted {provider} collection exceeded its {deadline.Budget.TotalSeconds:0}-second deadline. No package was ingested.";
}
