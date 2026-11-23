# FND-010 production-managed checkpoint integration

This increment adds an **opt-in integration seam**, not a deployed production service. The Python command `scripts/security/fnd010_managed_checkpoint.py` uses Azure workload identity via DefaultAzureCredential, a **versioned Azure Key Vault RSA signing key** (PS256), a separately pinned RSA public key, and create-only Azure Blob publication. It verifies the signature before upload and checks uploaded bytes by read-back. The private key is never exported by the script.

## Production prerequisites
1. Provision an RSA signing key in Azure Key Vault / Managed HSM with sign-only workload permissions, separated from SQL operators. Pin the matching public key in an independently managed trust store.
2. Provision a separate Azure Storage account/container with **locked time-based immutability policy** and retention matching compliance requirements. Set least-privilege blob creation permissions; prevent deletion/overwrites and account-policy changes. The script's `FND010_IMMUTABLE_STORAGE_ATTESTED=true` flag is an operator assertion, **not proof** of immutable policy. Require independent policy inspection before enabling a production scheduler.
3. Supply a trusted SQL chain sequence/head from an independently authenticated read-only path; never accept caller-provided sequence/hash as trustworthy production inputs. This command takes those as parameters for integration flexibility and therefore is **not safe as an unattended production publisher without a trusted source adapter**.
4. Store the externally trusted latest checkpoint in a monotonic trust anchor and reject rollback/fork. Add full-chain verification, alerts, scheduler, key rotation/revocation, recovery and audit monitoring.
5. Production key IDs must be versioned and allowlisted. The verifier's pinned public key must not be downloaded from the same potentially compromised checkpoint source.

The earlier Ed25519 CI demonstration remains separate: Azure Key Vault supports RSA PS256 for this managed integration. Contract tests use local RSA keys and mocked Blob operations, **not live Azure resources**. No cloud resources, secrets, storage policies or production schedules were provisioned.
