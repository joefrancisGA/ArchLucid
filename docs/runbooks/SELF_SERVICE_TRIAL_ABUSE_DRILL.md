# Self-service trial abuse drill (Evidence E1)

**Environment:** staging. `Auth:PublicSignup:Mode=PublicSelfService` for this drill only.

## Goal

Prove email lifetime cap and domain velocity deny repeat trial farms.

## Procedure

1. Complete one self-serve registration or post-auth workspace create with `trial-a@contoso.example`.
2. Attempt second create with same email (different org name) → expect deny + `archlucid_self_service_trial_abuse_denied_total{reason="email_lifetime_cap"}`.
3. Create trials for `user1@farm.example` … `userN@farm.example` until domain velocity deny (`domain_velocity`).

## Pass criteria

- [ ] Second same-email attempt denied with buyer-safe message
- [ ] Domain velocity deny fires at configured threshold
- [ ] Valid invitation token bypasses farm policy (separate test)
