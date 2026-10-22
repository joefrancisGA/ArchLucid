SET NOCOUNT ON;
GO

/* 185: Fine-grained custom roles and user assignments (built-in roles seeded per tenant as IsSystem rows). */

IF OBJECT_ID(N'dbo.CustomRoles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CustomRoles
    (
        Id UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_CustomRoles PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT FK_CustomRoles_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id),
        Name NVARCHAR(128) NOT NULL,
        Description NVARCHAR(512) NULL,
        PermissionsJson NVARCHAR(MAX) NOT NULL,
        IsSystem BIT NOT NULL
            CONSTRAINT DF_CustomRoles_IsSystem DEFAULT (0),
        CreatedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_CustomRoles_CreatedUtc DEFAULT SYSUTCDATETIME(),
        UpdatedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_CustomRoles_UpdatedUtc DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_CustomRoles_TenantId_Name UNIQUE (TenantId, Name)
    );

    CREATE INDEX IX_CustomRoles_TenantId ON dbo.CustomRoles (TenantId);
END;
GO

IF OBJECT_ID(N'dbo.UserCustomRoleAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserCustomRoleAssignments
    (
        UserId UNIQUEIDENTIFIER NOT NULL,
        CustomRoleId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT FK_UserCustomRoleAssignments_CustomRoles FOREIGN KEY (CustomRoleId) REFERENCES dbo.CustomRoles (Id) ON DELETE CASCADE,
        AssignedUtc DATETIME2(7) NOT NULL
            CONSTRAINT DF_UserCustomRoleAssignments_AssignedUtc DEFAULT SYSUTCDATETIME(),
        AssignedByActorId NVARCHAR(256) NULL,
        CONSTRAINT PK_UserCustomRoleAssignments PRIMARY KEY (UserId, CustomRoleId)
    );

    CREATE INDEX IX_UserCustomRoleAssignments_CustomRoleId ON dbo.UserCustomRoleAssignments (CustomRoleId);
END;
GO
