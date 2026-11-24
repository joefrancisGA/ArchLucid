-- Control-plane aggregate only. Evidence and scoped audit records remain in their existing stores.
IF OBJECT_ID(N'dbo.ProviderQualityState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProviderQualityState
    (
        DeploymentKey CHAR(64) NOT NULL,
        StateJson NVARCHAR(MAX) NOT NULL,
        CONSTRAINT PK_ProviderQualityState PRIMARY KEY (DeploymentKey),
        CONSTRAINT CK_ProviderQualityState_Json CHECK (ISJSON(StateJson) = 1)
    );
END;
GO
