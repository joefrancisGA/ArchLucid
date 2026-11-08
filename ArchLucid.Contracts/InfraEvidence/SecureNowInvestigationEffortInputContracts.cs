namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecureNowInvestigationEffortInputsResponse
{
    public string BaselineHours
    {
        get;
        init;
    } = string.Empty;

    public string AfterHours
    {
        get;
        init;
    } = string.Empty;

    public string AnnualInvestigations
    {
        get;
        init;
    } = string.Empty;

    public string HourlyRate
    {
        get;
        init;
    } = string.Empty;

    public string AnnualCost
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

public sealed class SecureNowInvestigationEffortInputsWriteRequest
{
    public string BaselineHours
    {
        get;
        init;
    } = string.Empty;

    public string AfterHours
    {
        get;
        init;
    } = string.Empty;

    public string AnnualInvestigations
    {
        get;
        init;
    } = string.Empty;

    public string HourlyRate
    {
        get;
        init;
    } = string.Empty;

    public string AnnualCost
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SecureNowInvestigationEffortInputsSaveResult
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

    public SecureNowInvestigationEffortInputsResponse? Inputs
    {
        get;
        init;
    }
}
