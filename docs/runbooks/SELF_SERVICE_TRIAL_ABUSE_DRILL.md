# Self-service trial abuse drill (Evidence E1)

**Environment:** staging. `Auth:PublicSignup:Mode=PublicSelfService` for this drill only.  
**Default product posture is InviteOnly** — restore InviteOnly immediately after the drill.

## Goal

Prove email lifetime cap and domain velocity deny repeat trial farms (register + post-auth create).

## Artifacts

| Artifact | Role |
|----------|------|
| `scripts/load/self-service-trial-farm-stub.js` | k6 anonymous `/v1/register` farm |
| `scripts/ci/run_email_otp_abuse_drill.ps1 -IncludeFarmStub` | Optional orchestrator |
| `ISelfServiceTrialAbusePolicy` unit tests | In-process deny coverage |

## Procedure

1. Complete one self-serve registration or post-auth workspace create with `trial-a@contoso.example`.
2. Attempt second create with same email (different org name) → expect deny + `archlucid_self_service_trial_abuse_denied_total{reason="email_lifetime_cap"}` (or equivalent audit).
3. Create trials for `user1@farm.example` … `userN@farm.example` until domain velocity deny (`domain_velocity`).
4. Optional burst:

```text
k6 run scripts/load/self-service-trial-farm-stub.js -e BASE_URL=https://YOUR-STAGING-API -e EMAIL_DOMAIN=farm.example
```

5. Confirm responses are buyer-safe (k6 `trial_farm_body_safe`) and restore `Auth:PublicSignup:Mode=InviteOnly`.

## Pass criteria

- [ ] Second same-email attempt denied with buyer-safe message
- [ ] Domain velocity deny fires at configured threshold
- [ ] Valid invitation token bypasses farm policy (separate test)
- [ ] Post-auth `CreateWorkspaceAsync` path also evaluates abuse policy
- [ ] InviteOnly restored after drill
