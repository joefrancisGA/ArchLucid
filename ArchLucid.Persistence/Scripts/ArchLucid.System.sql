/*
  Optional reference DDL for the **system / control-plane** catalog only.

  Authoritative system-plane changes ship as DbUp scripts under `ArchLucid.Persistence/Migrations/System/`.
  This file is a human-readable pointer for operators who expect a consolidated script alongside
  `ArchLucid.sql` (tenant/product plane). Keep it aligned with `001_SystemTenantDirectory.sql` and
  `002_TenantDatabaseBindings.sql`.
*/
PRINT N'ArchLucid.System.sql: see ArchLucid.Persistence/Migrations/System/*.sql for control-plane DDL.';
