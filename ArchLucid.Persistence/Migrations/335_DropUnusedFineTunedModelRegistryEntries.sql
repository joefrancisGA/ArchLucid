/*
  Migration 326: Drop unused dbo.FineTunedModelRegistryEntries.

  Created in 267 as schema reserved for SQL registry parity. V1 DI still wires
  InMemoryFineTunedModelRegistry only; no application SQL writer exists.
  FineTuningTrainingExportAudits remains (written by SqlFineTuningTrainingExportAuditRepository).

  Idempotent: DROP only when present.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.FineTunedModelRegistryEntries', N'U') IS NOT NULL
    DROP TABLE dbo.FineTunedModelRegistryEntries;
GO
