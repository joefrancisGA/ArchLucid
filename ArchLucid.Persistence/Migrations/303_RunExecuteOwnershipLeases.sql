-- TB-943 / TB-961: durable execute ownership lease (one row per in-flight execute).
IF OBJECT_ID(N'dbo.RunExecuteOwnershipLeases', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RunExecuteOwnershipLeases
    (
        RunId              UNIQUEIDENTIFIER   NOT NULL,
        HolderInstanceId   NVARCHAR(256)      NOT NULL,
        LeaseExpiresUtc    DATETIMEOFFSET(7)  NOT NULL,
        HeartbeatUtc       DATETIMEOFFSET(7)  NOT NULL,
        CONSTRAINT PK_RunExecuteOwnershipLeases PRIMARY KEY CLUSTERED (RunId)
    );

    CREATE INDEX IX_RunExecuteOwnershipLeases_LeaseExpiresUtc
        ON dbo.RunExecuteOwnershipLeases (LeaseExpiresUtc ASC);
END;
