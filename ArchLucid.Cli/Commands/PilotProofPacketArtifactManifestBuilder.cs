using System.Globalization;
using System.Text.Json;

using ArchLucid.Application.Exports;

namespace ArchLucid.Cli.Commands;

/// <summary>Buyer-safe artifact manifest for proof-packet folders (CG-027 career posture overlay).</summary>
public static class PilotProofPacketArtifactManifestBuilder
{
    public static string BuildJson(
        string runId,
        IReadOnlyList<string> artifactIds,
        ExportBundleCareerPostureStamp postureStamp)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(artifactIds);
        ArgumentNullException.ThrowIfNull(postureStamp);

        var payload = new
        {
            schema = PilotProofPacketArtifactCatalog.ArtifactManifestSchema,
            runId,
            capturedUtc = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture),
            artifactIds,
            careerPosture = postureStamp.CareerPosture,
            structuralExecutionMode = postureStamp.StructuralExecutionMode,
            workingCareerRehearsalDoor = postureStamp.WorkingCareerRehearsalDoor,
            rehearsalIncomplete = postureStamp.RehearsalIncomplete,
        };

        return JsonSerializer.Serialize(payload, BuyerPacketFolderWriter.JsonWriteIndented);
    }
}
