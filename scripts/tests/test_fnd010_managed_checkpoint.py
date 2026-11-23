import copy
import unittest
from unittest.mock import Mock
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

from scripts.security.fnd010_managed_checkpoint import (
    build_payload, canonical, publish_create_only, verify_checkpoint,
)


class ManagedCheckpointTests(unittest.TestCase):
    def setUp(self):
        self.private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.payload = build_payload(
            15, "ab" * 32, "https://vault.example.vault.azure.net/keys/fnd010/123")
        self.checkpoint = {
            "payload": self.payload, "algorithm": "PS256",
        }
        import base64
        self.checkpoint["signature"] = base64.b64encode(
            self.private.sign(canonical(self.payload),
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                            salt_length=hashes.SHA256().digest_size),
                hashes.SHA256())
        ).decode()

    def test_valid_checkpoint(self):
        verify_checkpoint(self.checkpoint, self.private.public_key())

    def test_mutated_payload(self):
        changed = copy.deepcopy(self.checkpoint)
        changed["payload"]["headSha256"] = "cd" * 32
        with self.assertRaises(Exception):
            verify_checkpoint(changed, self.private.public_key())

    def test_wrong_key(self):
        other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        with self.assertRaises(Exception):
            verify_checkpoint(self.checkpoint, other.public_key())

    def test_rollback(self):
        with self.assertRaises(ValueError):
            verify_checkpoint(self.checkpoint, self.private.public_key(), (16, "cd" * 32))

    def test_same_sequence_fork(self):
        with self.assertRaises(ValueError):
            verify_checkpoint(self.checkpoint, self.private.public_key(), (15, "cd" * 32))

    def test_create_only_and_readback(self):
        blob = Mock()
        content = canonical(self.checkpoint)
        blob.download_blob.return_value.readall.return_value = content
        publish_create_only(blob, self.checkpoint)
        blob.upload_blob.assert_called_once()
        self.assertFalse(blob.upload_blob.call_args.kwargs["overwrite"])

    def test_readback_mismatch_rejected(self):
        blob = Mock()
        blob.download_blob.return_value.readall.return_value = b"tampered"
        with self.assertRaises(RuntimeError):
            publish_create_only(blob, self.checkpoint)


if __name__ == "__main__":
    unittest.main()
