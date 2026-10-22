namespace ArchLucid.Cli.Commands;

internal sealed class BuyerProofArtifactCollectionResult
{
    private BuyerProofArtifactCollectionResult(
        BuyerProofArtifactCollectionStatus status,
        BuyerProofArtifacts? artifacts,
        string? errorMessage,
        string? runId)
    {
        Status = status;
        Artifacts = artifacts;
        ErrorMessage = errorMessage;
        RunId = runId;
    }

    public BuyerProofArtifactCollectionStatus Status { get; }

    public BuyerProofArtifacts? Artifacts { get; }

    public string? ErrorMessage { get; }

    public string? RunId { get; }

    public static BuyerProofArtifactCollectionResult Success(BuyerProofArtifacts artifacts) =>
        new(BuyerProofArtifactCollectionStatus.Success, artifacts, null, null);

    public static BuyerProofArtifactCollectionResult NotFound(string runId) =>
        new(BuyerProofArtifactCollectionStatus.NotFound, null, null, runId);

    public static BuyerProofArtifactCollectionResult FetchFailed(string message) =>
        new(BuyerProofArtifactCollectionStatus.FetchFailed, null, message, null);

    public static BuyerProofArtifactCollectionResult GateFailed(string message) =>
        new(BuyerProofArtifactCollectionStatus.GateFailed, null, message, null);
}
