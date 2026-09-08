namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationRunNotFoundException : Exception
{
    public FindingVerificationRunNotFoundException(Guid runId)
        : base($"Run '{runId:D}' was not found or has no findings snapshot.")
    {
        RunId = runId;
    }

    public Guid RunId
    {
        get;
    }
}
