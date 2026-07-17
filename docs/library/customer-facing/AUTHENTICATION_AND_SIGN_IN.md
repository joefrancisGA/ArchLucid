# Authentication and sign-in

ArchLucid supports passwordless sign-in. You do not create or manage an ArchLucid password.

## How sign-in works

You can sign in with:

- **Work or school account** — Microsoft, Google, or your organization's single sign-on (SSO) when it is configured.
- **Email one-time code** — enter any email address that can receive mail; ArchLucid sends a short code to complete sign-in.

When both options are available, choose the method that fits your organization. If your email domain requires organizational SSO, ArchLucid directs you to your identity provider.

## Starting an evaluation workspace

From **Start your evaluation** (`/signup`), submit your organization details. After verification, return to ArchLucid and sign in with a work or school account or an email one-time code to open your evaluation workspace. No sales call is required for the self-serve evaluation path.

## Accepting an invitation

When a workspace administrator invites you, open the invitation link from email. You can accept with:

- the same email address using a one-time code, or
- a work or school account or organizational SSO when your tenant allows it.

If the invitation email does not match the account you used to sign in, ArchLucid asks you to confirm before adding you to the workspace.

## Enterprise SSO (optional and enforced)

**Optional SSO:** Organizations can configure SAML or OpenID Connect so members sign in through the company identity provider.

**Tenant-enforced SSO:** After a verified email domain is configured and enforcement is enabled, members with that domain must use the organization's identity provider for routine sign-in.

Email-code sign-in is not available as a routine bypass when SSO is enforced for your domain. Designated recovery paths exist for administrators; contact your workspace administrator if you are locked out.

## Account recovery

- **Email-code users:** use a new one-time code sent to your email. Rate limits apply to protect your account.
- **Work or school users:** add an approved secondary sign-in method from account security settings when your organization allows it.
- **SSO-enforced tenants:** contact your workspace administrator or designated recovery administrator. Platform-assisted recovery is available only through authorized support with audit records.

## Common sign-in issues

| What you see | What to try |
| --- | --- |
| Organization sign-in required | Use **Continue to organization sign-in** for your company identity provider. |
| Code expired or incorrect | Request a new one-time code and check spam or junk folders. |
| Too many attempts | Wait a few minutes before requesting another code. |
| Invitation email mismatch | Confirm you are signing in with the invited address or follow the on-screen confirmation. |
| Already registered organization | Sign in to the existing workspace or use a different email for a new evaluation. |

## Security and privacy

- Sign-in events and administrative identity changes are recorded in the audit trail.
- ArchLucid does not ask you to create a product password for routine access.
- For data handling and assurance materials, see **Security and trust** and **What ArchLucid does with your data**.
