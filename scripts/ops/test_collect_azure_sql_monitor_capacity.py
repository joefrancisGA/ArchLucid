import datetime as dt
import unittest
from scripts.ops.collect_azure_sql_monitor_capacity import normalize, collect

RID="/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/test/providers/Microsoft.Sql/servers/test/databases/ArchLucidCapacityTest_Bench"
START=dt.datetime(2026,10,28,12,0,tzinfo=dt.timezone.utc)
END=dt.datetime(2026,10,28,12,2,tzinfo=dt.timezone.utc)
def payload(metric="cpu_percent", values=(10,20), dimensioned=False):
    return {"value":[{"name":{"value":metric},"timeseries":[{
        "metadatavalues":[{"value":"tenant"}] if dimensioned else [],
        "data":[{"timeStamp":"2026-10-28T12:00:00Z","average":values[0]},
                {"timeStamp":"2026-10-28T12:01:00Z","average":values[1]}]}]}]}
class AzureSqlMonitorCollectorTests(unittest.TestCase):
    def test_valid_metric_matches_correlator_shape(self):
        result=normalize(payload(),RID,"cpu_percent",START,END)
        self.assertEqual("cpu_percent",result["metricName"])
        self.assertEqual(RID,result["resourceId"])
        self.assertEqual(2,len(result["observations"]))
    def test_reject_mismatch_and_dimensioned_results(self):
        with self.assertRaises(ValueError):
            normalize(payload("storage_percent"),RID,"cpu_percent",START,END)
        with self.assertRaises(ValueError):
            normalize(payload(dimensioned=True),RID,"cpu_percent",START,END)
    def test_missing_and_negative_samples_fail(self):
        with self.assertRaises(ValueError):
            normalize(payload(values=(10,-1)),RID,"cpu_percent",START,END)
        with self.assertRaises(ValueError):
            normalize({"value":[]},RID,"cpu_percent",START,END)
    def test_invalid_resource_or_window_fails_before_auth(self):
        with self.assertRaises(ValueError):
            collect(RID.replace("ArchLucidCapacityTest_Bench","Production"),"cpu_percent",START,END)
        with self.assertRaises(ValueError):
            collect(RID,"cpu_percent",START,START)
if __name__=="__main__":
    unittest.main()
