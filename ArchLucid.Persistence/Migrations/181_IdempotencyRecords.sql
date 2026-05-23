IF OBJECT_ID('dbo.IdempotencyRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.IdempotencyRecords
    (
        IdempotencyKey NVARCHAR(128) NOT NULL,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        StatusCode INT NOT NULL,
        ResponseBody NVARCHAR(MAX) NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CONSTRAINT PK_IdempotencyRecords PRIMARY KEY (TenantId, IdempotencyKey)
    );
END
GO
