namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecureNowPilotPathDispositionResponse
{
    public Guid PathId
    {
        get;
        init;
    }

    public string Outcome
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;

    public DateTime RecordedUtc
    {
        get;
        init;
    }
}

public sealed class SecureNowPilotPathDispositionWriteRequest
{
    public string Outcome
    {
        get;
        init;
    } = string.Empty;

    public string Rationale
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecureNowPilotPathDispositionSaveResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public SecureNowPilotPathDispositionResponse? Disposition
    {
        get;
        init;
    }
}
