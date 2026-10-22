/*
  404: Remediation instance change implementation attestation (SN-VF-04).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.RemediationInstances', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.RemediationInstances', N'ChangeImplementedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.RemediationInstances
        ADD ChangeImplementedUtc DATETIME2 NULL;
END;
GO
