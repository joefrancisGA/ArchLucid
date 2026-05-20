/*
  176: Per-user saved filter/view presets for operator Audit log and Graph explorer.

  RLS: not applied — tenant id + user id are the scope; API enforces caller tenant via IScopeContextProvider
  and caller user via IActorContext.GetActorId().
*/
IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OperatorSavedViews
    (
        Id          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_OperatorSavedViews PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId    UNIQUEIDENTIFIER NOT NULL,
        UserId      NVARCHAR(256)    NOT NULL,
        Surface     NVARCHAR(64)     NOT NULL,
        Name        NVARCHAR(200)    NOT NULL,
        SortKey     NVARCHAR(128)    NULL,
        PayloadJson NVARCHAR(MAX)    NOT NULL,
        CreatedUtc  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_OperatorSavedViews_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc  DATETIME2(7)     NOT NULL
            CONSTRAINT DF_OperatorSavedViews_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_OperatorSavedViews_Surface CHECK (Surface IN (N'audit', N'graph')),
        CONSTRAINT CK_OperatorSavedViews_PayloadJson CHECK (ISJSON(PayloadJson) = 1),
        CONSTRAINT UQ_OperatorSavedViews_TenantUserSurfaceName UNIQUE (TenantId, UserId, Surface, Name),
        CONSTRAINT FK_OperatorSavedViews_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );

    CREATE INDEX IX_OperatorSavedViews_TenantUserSurface
        ON dbo.OperatorSavedViews (TenantId, UserId, Surface)
        INCLUDE (Name, SortKey, UpdatedUtc);
END;
GO
