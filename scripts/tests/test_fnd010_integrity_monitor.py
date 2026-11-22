import unittest
from scripts.security.fnd010_integrity_monitor import verify_sql_chain


def fixture(seq=2, digest="ab" * 32):
    return {"payload": {"sequence": seq, "headSha256": digest}}


def query_fixture(*, integrity=0, journal=0, count=3, maximum=3, anchor="ab" * 32):
    """Return one response per SQL query; never silently treat stats as a journal count."""
    def query(sql):
        if "COUNT(*) FROM Links" in sql:
            return f"{integrity}\n"
        if "COUNT(*) FROM dbo.AuthorizationDecisionChain c" in sql:
            return f"{journal}\n"
        if "COUNT_BIG(*)" in sql:
            return f"{count}:{maximum}\n"
        if "WHERE SequenceNo=" in sql:
            return f"{anchor}\n"
        raise AssertionError(f"Unexpected SQL verification query: {sql[:150]}")
    return query


class IntegrityMonitorTests(unittest.TestCase):
    def test_valid_chain_with_signed_anchor(self):
        result = verify_sql_chain(query_fixture(), fixture())
        self.assertEqual(result["checkedRecords"], 3)
        self.assertEqual(result["trustedCheckpointSequence"], 2)
        self.assertEqual(result["integrity"], "verified")

    def test_modified_chain_detected(self):
        with self.assertRaisesRegex(ValueError, "integrity violations"):
            verify_sql_chain(query_fixture(integrity=1), fixture())

    def test_missing_sequence_detected(self):
        with self.assertRaisesRegex(ValueError, "Missing"):
            verify_sql_chain(query_fixture(count=2, maximum=3), fixture())

    def test_anchor_mismatch_detected(self):
        with self.assertRaisesRegex(ValueError, "Signed checkpoint"):
            verify_sql_chain(query_fixture(anchor="cd" * 32), fixture())

    def test_truncated_history_detected_before_anchor_lookup(self):
        def query(sql):
            if "WHERE SequenceNo=" in sql:
                raise AssertionError("Should reject rollback without looking up missing anchor")
            return query_fixture(count=1, maximum=1)(sql)

        with self.assertRaisesRegex(ValueError, "rollback"):
            verify_sql_chain(query, fixture())

    def test_invalid_genesis_detected(self):
        with self.assertRaisesRegex(ValueError, "genesis"):
            verify_sql_chain(query_fixture(count=0, maximum=0), fixture(0, "ab" * 32))

    def test_empty_chain_accepts_only_zero_hash_genesis(self):
        result = verify_sql_chain(
            query_fixture(count=0, maximum=0), fixture(0, "00" * 32))
        self.assertEqual(result["checkedRecords"], 0)

    def test_journal_mismatch_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "journal/chain"):
            verify_sql_chain(query_fixture(journal=1), fixture())

    def test_absent_or_malformed_signed_anchor_fails_closed(self):
        for anchor in ("", "ab" * 31, "ab" * 33, "not a hash", "ab" * 32 + "\n" + "cd" * 32):
            with self.subTest(anchor=anchor), self.assertRaisesRegex(ValueError, "Signed checkpoint"):
                verify_sql_chain(query_fixture(anchor=anchor), fixture())

    def test_noncanonical_integrity_count_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Unexpected SQL integrity result"):
            verify_sql_chain(query_fixture(integrity="0\n0"), fixture())


if __name__ == "__main__":
    unittest.main()
