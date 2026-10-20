namespace ArchLucid.Core.InfraEvidence;

public sealed class RemediationFactoryFindingMetricsAggregate
{
    public int OpenFindings
    {
        get;
        init;
    }

    public int CriticalExposureCount
    {
        get;
        init;
    }

    public int CreatedThisWeek
    {
        get;
        init;
    }

    public int RecurrenceCount
    {
        get;
        init;
    }

    public double AverageAgeDays
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationFactoryMetricKeyCount> TopControlIds
    {
        get;
        init;
    } = [];
}

public sealed class RemediationFactoryInstanceMetricsAggregate
{
    public int TotalInstances
    {
        get;
        init;
    }

    public int RemediatedThisWeek
    {
        get;
        init;
    }

    public int AutomatedCount
    {
        get;
        init;
    }

    public int VerificationFailureCount
    {
        get;
        init;
    }

    public int BusinessBlockedCount
    {
        get;
        init;
    }

    public IReadOnlyList<RemediationFactoryMetricKeyCount> TopPatternKeys
    {
        get;
        init;
    } = [];
}

public sealed class RemediationFactoryExceptionMetricsAggregate
{
    public int ExceptionsActive
    {
        get;
        init;
    }

    public int ExceptionsExpired
    {
        get;
        init;
    }

    public int ExceptionsExpiringSoon
    {
        get;
        init;
    }
}

public sealed class RemediationFactoryMetricKeyCount
{
    public string Key
    {
        get;
        init;
    } = string.Empty;

    public int Count
    {
        get;
        init;
    }
}
