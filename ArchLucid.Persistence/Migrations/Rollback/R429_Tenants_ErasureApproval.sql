/* Older applications ignore these nullable columns. Retain recorded approvals on rollback,
   including in a shared catalog where the system and tenant migrations target the same table. */
PRINT N'Tenant erasure approval columns retained.';
GO
