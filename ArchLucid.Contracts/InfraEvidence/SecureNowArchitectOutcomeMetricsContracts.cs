namespace ArchLucid.Contracts.InfraEvidence;

public sealed class SecureNowArchitectSupportingOperationalMetricsResponse
{
    public int OpenFindings
    {
        get;
        init;
    }
}

public sealed class SecureNowArchitectOutcomeMetricsResponse
{
    public Guid FromSnapshotId
    {
        get;
        init;
    }

    public Guid ToSnapshotId
    {
        get;
        init;
    }

    public string RuleVersion
    {
        get;
        init;
    } = string.Empty;

    public int CriticalOrHighConfidencePathsRemoved
    {
        get;
        init;
    }

    public int PrivilegedIdentityNodesOnPathsReduced
    {
        get;
        init;
    }

    public int UnrestrictedEgressCapabilityPathsReduced
    {
        get;
        init;
    }

    public int AssertedCrownJewelExposurePathsRemoved
    {
        get;
        init;
    }

    public int SharedControlBlastRadiusPathsRemoved
    {
        get;
        init;
    }

    public int ExceptionsExpired
    {
        get;
        init;
    }

    public int RemediationRecurrenceCount
    {
        get;
        init;
    }

    public SecureNowArchitectSupportingOperationalMetricsResponse? SupportingOperationalMetrics
    {
        get;
        init;
    }
}
