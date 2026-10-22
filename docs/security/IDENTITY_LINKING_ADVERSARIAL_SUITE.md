# Identity linking adversarial suite (Evidence E2)

Automated tests: `ArchLucid.Application.Tests/Identity/AuthenticationIdentityLinkingAdversarialTests.cs`

| # | Scenario | Test method | Expected |
|---|----------|-------------|----------|
| 1 | Stolen OTP reuse | `ConfirmLink_rejects_reused_otp_challenge` | Deny |
| 2 | Cross-account email attach | `CreateProposal_rejects_email_bound_to_other_user` | Deny |
| 3 | External subject collision | `ConfirmLink_rejects_subject_owned_by_other_user` | Deny |
| 4 | Proposal IDOR | `ConfirmLink_rejects_other_users_proposal` | Deny |
| 5 | Unverified external attach | Covered in `PlatformIdentityServiceTests` | Deny |
| 6 | Race duplicate confirm | `ConfirmLink_second_confirm_fails` | One winner |
| 7 | Remove last sign-in method | `SignInMethodRemovalPolicy_*` tests | Policy deny |
| 8 | SSO bypass via link | `EmailOtpAuthServiceTests` SSO enforce | SSO required |
| 9 | Stale proposal | `ConfirmLink_rejects_expired_proposal` | Deny |
| 10 | Actor mismatch | `CancelLink_rejects_wrong_user` | Deny |

Residual: third-party pen-test (TB-136, V1.1 backlog) not substituted by this suite.
