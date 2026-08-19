/*
  277: Tenant-scoped user invitations for admin invite UI (TB-793).

  RLS: not applied — tenant scope enforced in application services and repositories.
*/
IF OBJECT_ID(N'dbo.UserInvitations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserInvitations
    (
        Id               UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_UserInvitations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
        TenantId         UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId      UNIQUEIDENTIFIER NOT NULL,
        Email            NVARCHAR(320)    NOT NULL,
        AppRole          NVARCHAR(64)     NOT NULL,
        InvitedByActorId NVARCHAR(256)    NOT NULL,
        Message          NVARCHAR(2000)   NULL,
        TokenHash        VARBINARY(32)    NOT NULL,
        Status           NVARCHAR(16)     NOT NULL,
        CreatedUtc       DATETIME2(7)     NOT NULL
            CONSTRAINT DF_UserInvitations_CreatedUtc DEFAULT SYSUTCDATETIME(),
        ExpiresUtc       DATETIME2(7)     NOT NULL,
        RevokedUtc       DATETIME2(7)     NULL,
        AcceptedUtc      DATETIME2(7)     NULL,
        CONSTRAINT CK_UserInvitations_Status CHECK (Status IN (N'Pending', N'Revoked', N'Accepted'))
    );

    CREATE UNIQUE INDEX UX_UserInvitations_PendingEmail
        ON dbo.UserInvitations (TenantId, Email)
        WHERE Status = N'Pending';

    CREATE INDEX IX_UserInvitations_Tenant_List
        ON dbo.UserInvitations (TenantId, CreatedUtc DESC);
END;
GO
