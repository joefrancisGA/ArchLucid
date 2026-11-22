#!/usr/bin/env python3
"""Production integration seam: Key Vault PS256 signing + create-only Blob checkpoint.

Requires an externally configured immutable Blob container and independent
verification-key pinning. This script never exports private signing keys.
"""
from __future__ import annotations
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path

DOMAIN = "archlucid.fnd010.authorization-checkpoint.v2"


def canonical(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=False, allow_nan=False).encode("utf-8")


def build_payload(sequence: int, head_hash: str, key_id: str) -> dict:
    if type(sequence) is not int or sequence < 0:
        raise ValueError("Invalid sequence")
    if len(head_hash) != 64 or any(c not in "0123456789abcdef" for c in head_hash):
        raise ValueError("Invalid lowercase SHA-256 digest")
    if not key_id.startswith("https://") or "/keys/" not in key_id:
        raise ValueError("A versioned Key Vault key ID is required")
    return dict(domain=DOMAIN, sequence=sequence, headSha256=head_hash,
                keyId=key_id, issuedAt=datetime.now(timezone.utc).isoformat())


def sign_checkpoint(payload: dict, crypto_client) -> dict:
    from azure.keyvault.keys.crypto import SignatureAlgorithm
    digest = hashlib.sha256(canonical(payload)).digest()
    result = crypto_client.sign(SignatureAlgorithm.ps256, digest)
    return dict(payload=payload, algorithm="PS256",
                signature=base64.b64encode(result.signature).decode("ascii"))


def verify_checkpoint(checkpoint: dict, pinned_public_key,
                      minimum: tuple[int, str] | None = None) -> None:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    payload = checkpoint["payload"]
    if checkpoint["algorithm"] != "PS256" or payload["domain"] != DOMAIN:
        raise ValueError("Unsupported checkpoint algorithm or domain")
    if set(payload) != {"domain", "sequence", "headSha256", "keyId", "issuedAt"}:
        raise ValueError("Unexpected checkpoint fields")
    digest = payload["headSha256"]
    if type(payload["sequence"]) is not int or payload["sequence"] < 0 or (
        not isinstance(digest, str) or len(digest) != 64 or
        any(c not in "0123456789abcdef" for c in digest)
    ):
        raise ValueError("Malformed checkpoint head")
    signature = base64.b64decode(checkpoint["signature"], validate=True)
    pinned_public_key.verify(signature, canonical(payload),
                             padding.PSS(mgf=padding.MGF1(hashes.SHA256()),
                                         salt_length=hashes.SHA256().digest_size),
                             hashes.SHA256())
    if minimum:
        seq, head = minimum
        if payload["sequence"] < seq or (payload["sequence"] == seq and digest != head):
            raise ValueError("Rollback or fork detected")


def publish_create_only(blob_client, checkpoint: dict) -> str:
    content = canonical(checkpoint)
    blob_client.upload_blob(content, overwrite=False, metadata={
        "fnd010": "checkpoint", "sequence": str(checkpoint["payload"]["sequence"])
    })
    # Read-back confirms availability; immutable retention must be configured
    # and independently attested at the storage-account/container boundary.
    if blob_client.download_blob().readall() != content:
        raise RuntimeError("Checkpoint read-back mismatch")
    return hashlib.sha256(content).hexdigest()


def main() -> None:
    from azure.identity import DefaultAzureCredential
    from azure.keyvault.keys.crypto import CryptographyClient
    from azure.storage.blob import BlobServiceClient
    from cryptography.hazmat.primitives import serialization
    parser = argparse.ArgumentParser()
    parser.add_argument("--sequence", required=True, type=int)
    parser.add_argument("--head-sha256", required=True)
    parser.add_argument("--key-id", required=True, help="Versioned Key Vault RSA key URI")
    parser.add_argument("--account-url", required=True)
    parser.add_argument("--container", required=True)
    parser.add_argument("--pinned-public-key", required=True)
    args = parser.parse_args()
    if os.getenv("FND010_IMMUTABLE_STORAGE_ATTESTED") != "true":
        raise RuntimeError("Immutable container policy must be independently attested")
    credential = DefaultAzureCredential()
    crypto = CryptographyClient(args.key_id, credential)
    payload = build_payload(args.sequence, args.head_sha256, args.key_id)
    checkpoint = sign_checkpoint(payload, crypto)
    pinned = serialization.load_pem_public_key(Path(args.pinned_public_key).read_bytes())
    verify_checkpoint(checkpoint, pinned)
    blob_service = BlobServiceClient(args.account_url, credential=credential)
    name = f"fnd010/checkpoints/{args.sequence:020d}-{args.head_sha256}.json"
    client = blob_service.get_blob_client(args.container, name)
    checksum = publish_create_only(client, checkpoint)
    print(json.dumps({"blob": name, "sha256": checksum, "sequence": args.sequence}))


if __name__ == "__main__":
    main()
