# Identity linking — support runbook

## Safe inspection

- Audit types: `Identity.AuthenticationIdentityLinkProposed`, `Confirmed`, `Failed`, `Cancelled`.
- Never link accounts based on email string match alone (product enforces external-key uniqueness).

## Disputed link

1. Confirm both platform user IDs and provider subjects from audit.
2. If external identity attached elsewhere: `IdentityAlreadyAttachedToAnotherUserException` — expected deny.
3. User must sign in with the provider that owns the subject, or cancel pending proposal.

## Adversarial test map

See `docs/security/IDENTITY_LINKING_ADVERSARIAL_SUITE.md`.
