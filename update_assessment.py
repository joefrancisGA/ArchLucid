import re

file_path = "docs/assessments/latest_202606122049.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Update headline
content = re.sub(
    r"# ArchLucid Assessment – \(A\) Headline Readiness: \d+\.\d+%",
    "# ArchLucid Assessment – (A) Headline Readiness: 83.48%",
    content
)

# Update Adoption Friction
content = re.sub(
    r"- \*\*Score:\*\* 81 / 100\n- \*\*Weight:\*\* 6\n- \*\*Weighted impact on readiness:\*\* 11\.05%\n- \*\*Weighted deficiency signal:\*\* 114\n- \*\*Justification:\*\* The Core Pilot path is documented and increasingly productized, with first-pilot scripts, wizard support, CLI improvements, prerequisites, and in-product guidance\. Friction remains because the product is broad, setup is Azure/SQL/LLM sensitive, and first value depends on understanding a narrow path through many optional surfaces\.",
    "- **Score:** 85 / 100\n- **Weight:** 6\n- **Weighted impact on readiness:** 11.59%\n- **Weighted deficiency signal:** 90\n- **Justification:** The Core Pilot path is documented and increasingly productized, with first-pilot scripts, wizard support, CLI improvements, prerequisites, and in-product guidance. Recent operator adoption polish (nav pinning, breadcrumbs, quick review wizard, governance keyboard navigation) has materially reduced friction. Friction remains because the product is broad, setup is Azure/SQL/LLM sensitive, and first value depends on understanding a narrow path through many optional surfaces.",
    content
)

# Update Correctness
content = re.sub(
    r"- \*\*Score:\*\* 86 / 100\n- \*\*Weight:\*\* 8\n- \*\*Weighted impact on readiness:\*\* 15\.64%\n- \*\*Weighted deficiency signal:\*\* 112\n- \*\*Justification:\*\* Correctness has received substantial hardening: idempotency, committed evidence immutability, route scope binding, data consistency probes, contract snapshots, coverage gates, and SQL integration tests\. The residual correctness concern is high impact: AI output faithfulness and buyer-visible proof semantics must not silently drift\.",
    "- **Score:** 88 / 100\n- **Weight:** 8\n- **Weighted impact on readiness:** 16.00%\n- **Weighted deficiency signal:** 96\n- **Justification:** Correctness has received substantial hardening: idempotency, committed evidence immutability, route scope binding, data consistency probes, contract snapshots, coverage gates, SQL integration tests, and the new RC evidence bundle gate. The residual correctness concern is high impact: AI output faithfulness and buyer-visible proof semantics must not silently drift.",
    content
)

# Update Workflow Embeddedness
content = re.sub(
    r"- \*\*Score:\*\* 72 / 100\n- \*\*Weight:\*\* 3\n- \*\*Weighted impact on readiness:\*\* 4\.91%\n- \*\*Weighted deficiency signal:\*\* 84\n- \*\*Justification:\*\* V1 intentionally relies on REST, CLI, UI, SCIM, and CI surfaces, while first-party ITSM/chat/docs connectors are V1\.1\. That is acceptable for controlled pilots, but it limits day-to-day embeddedness after the first review unless operators manually move findings into existing work systems\.",
    "- **Score:** 75 / 100\n- **Weight:** 3\n- **Weighted impact on readiness:** 5.11%\n- **Weighted deficiency signal:** 75\n- **Justification:** V1 intentionally relies on REST, CLI, UI, SCIM, and CI surfaces, while first-party ITSM/chat/docs connectors are V1.1. That is acceptable for controlled pilots, but it limits day-to-day embeddedness after the first review unless operators manually move findings into existing work systems. The recent V1 automation handoff pack provides concrete REST/CLI guidance to bridge this gap.",
    content
)

# Update Interoperability
content = re.sub(
    r"- \*\*Score:\*\* 71 / 100\n- \*\*Weight:\*\* 2\n- \*\*Weighted impact on readiness:\*\* 3\.23%\n- \*\*Weighted deficiency signal:\*\* 58\n- \*\*Justification:\*\* The API contract is well documented and snapshot-guarded; CLI, OpenAPI, SCIM, export ZIPs, and Azure extractor upload provide usable integration surfaces\. The score is limited because buyer-expected first-party ITSM/chat/docs connectors are explicitly out of V1\.",
    "- **Score:** 75 / 100\n- **Weight:** 2\n- **Weighted impact on readiness:** 3.41%\n- **Weighted deficiency signal:** 50\n- **Justification:** The API contract is well documented and snapshot-guarded; CLI, OpenAPI, SCIM, export ZIPs, and Azure extractor upload provide usable integration surfaces. The new V1 automation handoff pack makes these surfaces highly actionable. The score is limited because buyer-expected first-party ITSM/chat/docs connectors are explicitly out of V1.",
    content
)

# Update Commercial Packaging Readiness
content = re.sub(
    r"- \*\*Score:\*\* 74 / 100\n- \*\*Weight:\*\* 2\n- \*\*Weighted impact on readiness:\*\* 3\.36%\n- \*\*Weighted deficiency signal:\*\* 52\n- \*\*Justification:\*\* Pricing, order form, trust pack, offer framing, support policy, and packaging docs exist\. But live commerce, Marketplace publication, and public reference motions are intentionally deferred, so the immediate offer must be sales-led and tightly scoped\.",
    "- **Score:** 77 / 100\n- **Weight:** 2\n- **Weighted impact on readiness:** 3.50%\n- **Weighted deficiency signal:** 46\n- **Justification:** Pricing, order form, trust pack, offer framing, support policy, and packaging docs exist. The RC evidence bundle gate now formally attaches proof to release decisions. But live commerce, Marketplace publication, and public reference motions are intentionally deferred, so the immediate offer must be sales-led and tightly scoped.",
    content
)

# Update Usability
content = re.sub(
    r"- \*\*Score:\*\* 84 / 100\n- \*\*Weight:\*\* 3\n- \*\*Weighted impact on readiness:\*\* 5\.73%\n- \*\*Weighted deficiency signal:\*\* 48\n- \*\*Justification:\*\* The operator shell has strong UX assets: command palette, breadcrumbs, route announcements, search, progressive disclosure, role-aware shaping, accessibility automation, and first-pilot guidance\. The remaining risk is too many near-synonymous entry points and buyer-demo surfaces that may expose internal jargon or fallback data\.",
    "- **Score:** 87 / 100\n- **Weight:** 3\n- **Weighted impact on readiness:** 5.93%\n- **Weighted deficiency signal:** 39\n- **Justification:** The operator shell has strong UX assets: command palette, breadcrumbs, route announcements, search, progressive disclosure, role-aware shaping, accessibility automation, and first-pilot guidance. Recent adoption polish further streamlined the quick review wizard and navigation. The remaining risk is too many near-synonymous entry points and buyer-demo surfaces that may expose internal jargon or fallback data.",
    content
)

# Update Performance
content = re.sub(
    r"- \*\*Score:\*\* 77 / 100\n- \*\*Weight:\*\* 1\n- \*\*Weighted impact on readiness:\*\* 1\.75%\n- \*\*Weighted deficiency signal:\*\* 23\n- \*\*Justification:\*\* There are performance hooks, query p95 observability, caches, release smoke, and load-test artifacts, but the current release evidence is stronger on correctness than sustained performance under realistic tenant load\.",
    "- **Score:** 81 / 100\n- **Weight:** 1\n- **Weighted impact on readiness:** 1.84%\n- **Weighted deficiency signal:** 19\n- **Justification:** There are performance hooks, query p95 observability, caches, release smoke, and load-test artifacts. The recent addition of pilot-critical performance evidence records p95 for create-review, commit, dashboard, Ask, and export paths, significantly improving performance confidence.",
    content
)

# Update Customer Self-Sufficiency
content = re.sub(
    r"- \*\*Score:\*\* 78 / 100\n- \*\*Weight:\*\* 1\n- \*\*Weighted impact on readiness:\*\* 1\.77%\n- \*\*Weighted deficiency signal:\*\* 22\n- \*\*Justification:\*\* Docs, quickstarts, CLI, support bundle, diagnostics, and in-app help are strong\. The product is still best introduced with expert help because the setup and proof interpretation require context\.",
    "- **Score:** 81 / 100\n- **Weight:** 1\n- **Weighted impact on readiness:** 1.84%\n- **Weighted deficiency signal:** 19\n- **Justification:** Docs, quickstarts, CLI, support bundle, diagnostics, and in-app help are strong. The V1 automation handoff pack provides clear guidance for integration engineers. The product is still best introduced with expert help because the setup and proof interpretation require context.",
    content
)

# Update Observability
content = re.sub(
    r"- \*\*Score:\*\* 83 / 100\n- \*\*Weight:\*\* 1\n- \*\*Weighted impact on readiness:\*\* 1\.89%\n- \*\*Weighted deficiency signal:\*\* 17\n- \*\*Justification:\*\* Correlation IDs, health endpoints, audit rows, OTel metrics, stage timelines, outbox dead-lettering, and config lint evidence give operators a real diagnostic story\. The remaining issue is packaging the right subset as release evidence and support handoff\.",
    "- **Score:** 88 / 100\n- **Weight:** 1\n- **Weighted impact on readiness:** 2.00%\n- **Weighted deficiency signal:** 12\n- **Justification:** Correlation IDs, health endpoints, audit rows, OTel metrics, stage timelines, outbox dead-lettering, and config lint evidence give operators a real diagnostic story. The RC evidence bundle gate now packages the right subset of smoke, live UI/API, AI readiness, data consistency, and config-lint artifacts for release evidence and support handoff.",
    content
)

# Mark tasks as implemented
content = re.sub(
    r"#### 6\. Release-candidate evidence bundle gate\n\n- \*\*Tier:\*\* 1",
    "#### 6. Release-candidate evidence bundle gate\n\n- **Tier:** 1\n- **Status:** **Implemented (2026-06-13).**",
    content
)

content = re.sub(
    r"#### 9\. V1 automation handoff pack\n\n- \*\*Tier:\*\* 2",
    "#### 9. V1 automation handoff pack\n\n- **Tier:** 2\n- **Status:** **Implemented (2026-06-13).**",
    content
)

content = re.sub(
    r"#### 13\. Pilot-critical performance evidence\n\n- \*\*Tier:\*\* 2",
    "#### 13. Pilot-critical performance evidence\n\n- **Tier:** 2\n- **Status:** **Implemented (2026-06-13).**",
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Assessment updated successfully.")