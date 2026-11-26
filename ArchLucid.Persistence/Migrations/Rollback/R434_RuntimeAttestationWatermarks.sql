IF OBJECT_ID(N'dbo.TryAdvanceRuntimeAttestationWatermark', N'P') IS NOT NULL
    DROP PROCEDURE dbo.TryAdvanceRuntimeAttestationWatermark;
GO
IF OBJECT_ID(N'dbo.RuntimeAttestationWatermarks', N'U') IS NOT NULL
    DROP TABLE dbo.RuntimeAttestationWatermarks;
GO
