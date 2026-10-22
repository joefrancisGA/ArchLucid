/*
  R176: Rollback 176_OperatorSavedViews.sql — remove per-user saved filter/view presets table.
*/

IF OBJECT_ID(N'dbo.OperatorSavedViews', N'U') IS NOT NULL
    DROP TABLE dbo.OperatorSavedViews;
GO
