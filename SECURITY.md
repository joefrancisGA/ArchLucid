# Security policy

## Scope

This policy applies to the **ArchLucid** product sources in this repository (API, worker, operator UI, and related tooling) and to security issues that affect deployments built from them.

## Supported versions

Security fixes are applied on the **main development line** reflected in this repo. Release branches or tagged versions, if any, are supported according to your organization’s release policy; when in doubt, use the latest tagged release or `main`.

## Reporting a vulnerability

**Preferred:** If this repository is hosted on GitHub, use **[GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)** to open a **private** advisory for maintainers.

**Alternative:** Email **security@YOURDOMAIN** (replace with your organization’s security contact). If you do not yet have a mailbox, configure one or use GitHub private advisories until you do.

Please **do not** file public issues for undisclosed security bugs.

## What to include

- A short description of the issue and its impact (confidentiality, integrity, availability).
- Affected component (e.g. API, worker, UI) and version or commit when known.
- Steps to reproduce or proof-of-concept **without** live exploitation of production systems.
- Your contact for follow-up (optional).

**Do not** send real production secrets, live API keys, or personal data in the initial report.

## Our commitment

We aim to **acknowledge** valid reports within a **reasonable window** (typically a few business days) and to work toward a coordinated fix and disclosure timeline.

## Disclosure

Please **coordinate** with maintainers before **public** disclosure (blog posts, CVE without agreement, etc.) so users can deploy mitigations or patches first (**responsible disclosure**).

## Safe harbor

If you act in good faith—reporting issues without exploiting them beyond what is needed to demonstrate impact, and without accessing data that is not yours—we will treat your research as authorized for the purpose of improving security.
