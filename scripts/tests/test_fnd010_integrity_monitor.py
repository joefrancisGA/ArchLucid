import unittest
from scripts.security.fnd010_integrity_monitor import verify_sql_chain


def fixture(seq=2, digest="ab" * 32):
    return {"payload": {"sequence": seq, "headSha256": digest}}


class IntegrityMonitorTests(unittest.TestCase):
    def test_valid_chain_with_signed_anchor(self):
        def query(sql):
            if "COUNT(*) FROM Links" in sql or "COUNT(*) FROM dbo.AuthorizationDecisionChain c" in sql:
                return "0\n"
            if "COUNT_BIG(*)" in sql:
                return "3:3\n"
            return "ab" * 32 + "\n"
        result = verify_sql_chain(query, fixture())
        self.assertEqual(result["checkedRecords"], 3)

    def test_modified_chain_detected(self):
        with self.assertRaisesRegex(ValueError, "integrity violations"):
            verify_sql_chain(lambda sql: "1\n", fixture())

    def test_missing_sequence_detected(self):
        def query(sql):
            return "0\n" if "COUNT(*) FROM Links" in sql else "2:3\n"
        with self.assertRaisesRegex(ValueError, "Missing"):
            verify_sql_chain(query, fixture())

    def test_anchor_mismatch_detected(self):
        def query(sql):
            if "COUNT(*) FROM Links" in sql or "COUNT(*) FROM dbo.AuthorizationDecisionChain c" in sql:
                return "0\n"
            if "COUNT_BIG(*)" in sql:
                return "3:3\n"
            return "cd" * 32 + "\n"
        with self.assertRaisesRegex(ValueError, "Signed checkpoint"):
            verify_sql_chain(query, fixture())

    def test_truncated_history_detected(self):
        def query(sql):
            return "0\n" if "COUNT(*) FROM Links" in sql else "1:1\n"
        with self.assertRaisesRegex(ValueError, "rollback"):
            verify_sql_chain(query, fixture())

    def test_invalid_genesis_detected(self):
        def query(sql):
            return "0\n" if "COUNT(*) FROM Links" in sql else "0:0\n"
        with self.assertRaisesRegex(ValueError, "genesis"):
            verify_sql_chain(query, fixture(0, "ab" * 32))


if __name__ == "__main__":
    unittest.main()
