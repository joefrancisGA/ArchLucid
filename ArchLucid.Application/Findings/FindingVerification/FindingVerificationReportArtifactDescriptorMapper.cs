using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

public static class FindingVerificationReportArtifactDescriptorMapper
{
    public static ArtifactDescriptor ToDescriptor(FindingVerificationReportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return new ArtifactDescriptor
        {
            ArtifactId = record.ReportId,
            ArtifactType = ArtifactType.FindingVerificationReport,
            Name = $"Finding verification report ({record.CreatedUtc:yyyy-MM-dd HH:mm} UTC)",
            Format = "Markdown",
            CreatedUtc = record.CreatedUtc,
            ContentHash = record.ReportHash,
        };
    }
}
