namespace ArchLucid.Application.Findings.FindingVerification;

public sealed class FindingVerificationRunNotSealedException : Exception
{
    public FindingVerificationRunNotSealedException(Guid runId)
        : base($"Run '{runId:D}' has no sealed golden manifest hash.")
    {
        RunId = runId;
    }

    public Guid RunId
    {
        get;
    }
}
