/*
  192: Drop unreferenced legacy RLS predicate inline TVFs (rls.archiforge_scope_predicate /
       rls.archiforge_tenant_predicate).

  Idempotent with migration 165 (same guarded DROP logic); safe on catalogs that already applied 165.
*/

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'rls.archiforge_scope_predicate', N'IF') IS NOT NULL
   AND OBJECT_ID(N'sys.security_predicates', N'V') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'sys.security_predicates', N'V')
          AND c.name = N'predicate_definition')
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE CHARINDEX(N'rls.archiforge_scope_predicate', sp.predicate_definition COLLATE Latin1_General_CI_AI) > 0
           OR CHARINDEX(N'[rls].[archiforge_scope_predicate]', sp.predicate_definition COLLATE Latin1_General_CI_AI) > 0)
    EXEC (N'DROP FUNCTION rls.archiforge_scope_predicate;');
GO

IF OBJECT_ID(N'rls.archiforge_tenant_predicate', N'IF') IS NOT NULL
   AND OBJECT_ID(N'sys.security_predicates', N'V') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'sys.security_predicates', N'V')
          AND c.name = N'predicate_definition')
   AND NOT EXISTS (
        SELECT 1
        FROM sys.security_predicates AS sp
        WHERE CHARINDEX(N'rls.archiforge_tenant_predicate', sp.predicate_definition COLLATE Latin1_General_CI_AI) > 0
           OR CHARINDEX(N'[rls].[archiforge_tenant_predicate]', sp.predicate_definition COLLATE Latin1_General_CI_AI) > 0)
    EXEC (N'DROP FUNCTION rls.archiforge_tenant_predicate;');
GO
