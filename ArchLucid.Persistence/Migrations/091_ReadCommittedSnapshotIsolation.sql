/*
  091: READ_COMMITTED_SNAPSHOT (RCSI) — applied **after** DbUp by DatabaseMigrator.TryEnableReadCommittedSnapshotIfNeeded
  because SQL Server rejects ALTER DATABASE inside DbUp's per-script transaction wrapper.

  See: https://learn.microsoft.com/sql/t-sql/statements/alter-database-transact-sql-set-options
*/

SELECT 1;
