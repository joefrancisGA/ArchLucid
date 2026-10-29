import unittest
from scripts.ops.azure_sql_capacity_preflight import validate

RID="/subscriptions/123/resourceGroups/capacity/providers/Microsoft.Sql/servers/test/databases/ArchLucidCapacityTest_Bench"
CONN="Server=tcp:test.database.windows.net,1433;Database=ArchLucidCapacityTest_Bench;Encrypt=True;TrustServerCertificate=False;"
APPROVE="I_APPROVE_DESTRUCTIVE_TEST_DATA_WRITES"
class AzureSqlCapacityPreflightTests(unittest.TestCase):
    def test_explicitly_scoped_test_database_passes_preflight_only(self):
        self.assertEqual("PREFLIGHT_ONLY_NO_AZURE_ACCESS",validate(RID,"ArchLucidCapacityTest_Bench",APPROVE,CONN)["status"])
    def test_rejects_wrong_database_and_missing_approval(self):
        for db, approval in [("production",APPROVE),("ArchLucidCapacityTest_Other",APPROVE),("ArchLucidCapacityTest_Bench","")]:
            with self.assertRaises(ValueError):validate(RID,db,approval,CONN)
    def test_rejects_disabled_tls_validation(self):
        with self.assertRaises(ValueError):
            validate(RID,"ArchLucidCapacityTest_Bench",APPROVE,CONN.replace("TrustServerCertificate=False","TrustServerCertificate=True"))
if __name__=="__main__":
    unittest.main()
