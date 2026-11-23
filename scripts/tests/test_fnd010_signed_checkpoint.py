import base64
import copy
import unittest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from scripts.ci.fnd010_signed_checkpoint import issue, verify, GENESIS


class SignedCheckpointTests(unittest.TestCase):
    def setUp(self):
        self.private = Ed25519PrivateKey.generate()
        self.public = self.private.public_key()
        self.checkpoint = issue(42, "ab" * 32, "key-v1", self.private,
                                "2026-11-22T16:00:00+00:00")

    def test_valid_signature_and_head(self):
        verify(self.checkpoint, self.public, current_head=(42, "ab" * 32))

    def test_modified_digest_rejected(self):
        changed = copy.deepcopy(self.checkpoint)
        changed["payload"]["headSha256"] = "cd" * 32
        with self.assertRaises(Exception):
            verify(changed, self.public)

    def test_modified_sequence_rejected(self):
        changed = copy.deepcopy(self.checkpoint)
        changed["payload"]["sequence"] = 41
        with self.assertRaises(Exception):
            verify(changed, self.public)

    def test_wrong_key_rejected(self):
        with self.assertRaises(Exception):
            verify(self.checkpoint, Ed25519PrivateKey.generate().public_key())

    def test_sql_head_mismatch_rejected(self):
        with self.assertRaises(ValueError):
            verify(self.checkpoint, self.public, current_head=(42, "cd" * 32))

    def test_rollback_rejected(self):
        with self.assertRaises(ValueError):
            verify(self.checkpoint, self.public, trusted_minimum=(43, "cd" * 32))

    def test_equal_sequence_fork_rejected(self):
        with self.assertRaises(ValueError):
            verify(self.checkpoint, self.public, trusted_minimum=(42, "cd" * 32))

    def test_genesis_checkpoint(self):
        checkpoint = issue(0, GENESIS, "key-v1", self.private,
                           "2026-11-22T16:00:00+00:00")
        verify(checkpoint, self.public, current_head=(0, GENESIS))


if __name__ == "__main__":
    unittest.main()
