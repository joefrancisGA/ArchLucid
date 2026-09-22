# SA-06 — Toxic combination paths

**Do not** process all operational findings equally. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Compose existing privilege paths, intended-reachability paths, and (when present) unrestricted egress edges into `PathKind=ToxicCombination` when they share identities/resources. Prioritize combinations that reach asserted crown jewels **or** high-privilege data-plane roles when no assertion exists.

## Why

A missing tag, a public storage account, an old credential, and broad egress have different scanner severities. Together they can be Internet → app identity → PHI store → egress. Rank the **path**, not the CVSS of each leaf.

## Context

- Plane §5 ToxicCombination
- SA-03, SA-05 outputs
- IE-09 findings (optional join by CloudResourceId)
- Do not ingest Defender CVE payloads

## What to build

1. Join key: shared `CloudResourceId` / identity node on two or more path kinds.
2. Persist a new path whose hops are the concatenation (or a documented DAG walk) with provenance preserved per hop. Path band = weakest hop.
3. Finding title names the combination (exposure + identity + asset), not “multiple issues detected.”
4. If only one path kind exists, do not mint a toxic combination.
5. Tests: public storage + MI reader + outbound * NSG compose; missing-tag-only finding does not compose; idempotent hash.

## Acceptance criteria

- Leaf findings remain; combination is additive.
- No finding-as-graph-node.

## Constraints

- Do not call LLM to decide composition.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

B+C+D style fixtures produce one combination path; A (missing tag) does not.
