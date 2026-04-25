> **Scope:** Master Service Agreement (MSA) — Template (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Master Service Agreement (MSA) — Template (ArchLucid)

**Important — not legal advice:** This document is a **working template** for negotiation with customers. It **does not** constitute legal advice and has **not** been executed by any party. **Qualified legal counsel** must review and adapt every section before execution. Sections marked with **<<LEGAL REVIEW REQUIRED>>** need particular attention, but counsel should review the entire document.

**Parties:** Fill in legal names and addresses.

| Role | Party |
|------|--------|
| **Customer** | [Customer legal entity] |
| **Provider** | [ArchLucid vendor legal entity] |

**Effective date:** [date]

**Reference:** [Subscription / order form ID]

---

## 1. Definitions

Capitalized terms not defined here follow the [Data Processing Agreement](DPA_TEMPLATE.md) unless otherwise stated.

- **"Agreement"** means this Master Service Agreement, together with all Order Forms, the DPA, and any exhibits or schedules incorporated by reference.
- **"Authorized User"** means an individual whom Customer designates as a named architect seat under an active Order Form and who authenticates via Customer's identity provider.
- **"Confidential Information"** means any non-public information disclosed by one party to the other in connection with this Agreement, whether oral, written, or electronic, that is marked confidential or would reasonably be understood to be confidential given its nature and the circumstances of disclosure. Confidential Information excludes information that: (a) is or becomes publicly available without breach of this Agreement; (b) was known to the receiving party before disclosure without restriction; (c) is independently developed without use of the disclosing party's Confidential Information; or (d) is lawfully received from a third party without restriction.
- **"Customer Data"** means all data, content, and materials that Customer or its Authorized Users submit to, store in, or generate through the Services, including architecture descriptions, manifests, findings, audit records, and exports.
- **"Documentation"** means the then-current technical and user documentation for the Services published by Provider, including product guides, API references, and release notes.
- **"Effective Date"** means the date stated above or, if none, the date of the last signature below.
- **"Finding Engines"** means the analytical modules that evaluate architecture inputs and generate findings within the Services.
- **"Intellectual Property Rights"** means patents, copyrights, trademarks, trade secrets, and all other intellectual property or proprietary rights recognized under applicable law.
- **"Manifest"** means a structured, committed architecture output produced through the Services.
- **"Order Form"** means a mutually executed document that references this Agreement and specifies the subscription tier, seat count, workspace count, term, and fees. See [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) for the standard form.
- **"Personal Data"** has the meaning given in the [Data Processing Agreement](DPA_TEMPLATE.md).
- **"Professional Services"** means any implementation, consulting, training, or custom development services described in a separate statement of work.
- **"Run"** means a single invocation of the Services' architecture analysis workflow that produces a reviewable output.
- **"Services"** means the ArchLucid cloud-hosted, AI-assisted architecture workflow platform, including all features, APIs, and integrations made available to Customer under the applicable Order Form.
- **"Subscription Term"** means the period during which Customer is entitled to access the Services, as specified in each Order Form.
- **"Workspace"** means a logically isolated tenant boundary within the Services to which Authorized Users and Runs are scoped.

---

## 2. Scope of service

2.1 **Product description.** The Services provide an AI-assisted architecture workflow system that coordinates topology, cost, and compliance analysis into reviewable, defensible architecture packages. The Services help teams produce committed manifests, reviewable artifacts, governance evidence, and change visibility — as further described in the [Executive Sponsor Brief](../EXECUTIVE_SPONSOR_BRIEF.md) §1.

2.2 **Platform.** The Services are hosted on Microsoft Azure infrastructure as described in the product documentation and [Subprocessors](SUBPROCESSORS.md) listing. The primary Azure region is specified in the Order Form or security pack.

2.3 **Access.** Provider grants Customer a non-exclusive, non-transferable, non-sublicensable right to access and use the Services during the Subscription Term, solely for Customer's internal business purposes and subject to the terms of this Agreement and the applicable Order Form.

2.4 **Authorized Users.** Customer may permit access only to Authorized Users up to the seat count specified in the Order Form. Customer is responsible for its Authorized Users' compliance with this Agreement and for maintaining the confidentiality of authentication credentials.

2.5 **Restrictions.** Customer shall not: (a) sublicense, resell, or make the Services available to third parties except Authorized Users; (b) reverse-engineer, decompile, or disassemble the Services except to the extent expressly permitted by applicable law; (c) use the Services to build a competing product or service; (d) interfere with or disrupt the integrity or performance of the Services; or (e) attempt to gain unauthorized access to the Services or their related systems.

2.6 **Documentation.** Provider makes Documentation available as part of the Services. Customer may use the Documentation solely in connection with its permitted use of the Services.

---

## 3. Subscription terms

3.1 **Tiers.** The Services are offered in the packaging tiers described in the [Pricing Philosophy](PRICING_PHILOSOPHY.md) §3. The applicable tier, seat count, workspace count, and included Run allowance are specified in each Order Form.

3.2 **Fees.** Customer shall pay the fees specified in the Order Form. Fees are stated in U.S. dollars unless otherwise agreed. Pricing components may include a per-workspace platform fee, per-seat fees for named architects, and per-Run overage charges — as set forth in the Order Form and derived from the locked prices in [Pricing Philosophy](PRICING_PHILOSOPHY.md) §5.2.

3.3 **Payment terms.** Unless otherwise stated in the Order Form, invoices are due **net 30 days** from the invoice date. Late payments accrue interest at the lesser of **1.5% per month** or the maximum rate permitted by applicable law.

3.4 **Annual prepayment.** Annual prepayment options (where available per tier) are described in the Order Form. Annual prepayment does not alter the Subscription Term unless expressly stated.

3.5 **Taxes.** Fees are exclusive of taxes. Customer is responsible for all applicable taxes (excluding taxes based on Provider's net income) arising from this Agreement. If Provider is required to collect taxes, they will be added to the invoice.

3.6 **Run overages.** If Customer exceeds the included Run allowance in a billing period, Provider invoices overage Runs at the per-Run rate specified in the Order Form. Enterprise-tier customers are subject to a fair-use soft cap as described in the Order Form.

3.7 **Expansion.** Customer may add seats, workspaces, or upgrade tiers during the Subscription Term by executing an additional or amended Order Form. Added capacity is prorated for the remainder of the then-current billing period.

---

## 4. Service level agreement

4.1 **Service level targets.** Provider targets the service level objectives described in [API SLOs](../library/API_SLOS.md) §8. The current targets are summarized below for reference (authoritative values are in the SLO document):

| Objective | Target | Measurement window |
|-----------|--------|--------------------|
| **Availability** | 99.5% | 30 days rolling |
| **Error rate** | ≤ 0.5% HTTP 5xx | 30 days rolling |
| **Latency** | p95 under 2 seconds | 5-minute windows |

4.2 **"Target" language.** The objectives in §4.1 are **targets**, not guarantees, for V1 of the Services. Provider uses commercially reasonable efforts to meet or exceed the stated targets. Provider does not warrant uninterrupted or error-free operation of the Services.

4.3 **Scheduled maintenance.** Provider may perform scheduled maintenance outside peak business hours (defined as 06:00–22:00 in the Customer's primary time zone, Monday through Friday). Provider will give Customer at least **48 hours'** advance notice of scheduled maintenance expected to affect availability.

4.4 **Exclusions.** The service level targets do not apply to: (a) force majeure events; (b) Customer's or Authorized Users' misuse or misconfiguration; (c) failures of Customer's network, hardware, or identity provider; (d) scheduled maintenance with proper notice; or (e) alpha, beta, or preview features expressly designated as such.

4.5 **Service credits (Enterprise tier only).** <<LEGAL REVIEW REQUIRED>> For Enterprise-tier customers, if Provider fails to meet the availability target for two or more consecutive 30-day periods, Customer is entitled to a service credit equal to **[percentage — legal to define]** of the monthly fees attributable to the affected period, applied to the next invoice. Service credits are Customer's sole and exclusive remedy for failure to meet the availability target. The process for requesting service credits, including required evidence, is specified in the Order Form.

---

## 5. Data processing

5.1 **Data Processing Agreement.** The processing of Personal Data in connection with the Services is governed by the [Data Processing Agreement](DPA_TEMPLATE.md) (DPA), which is incorporated into this Agreement by reference.

5.2 **Customer Data ownership.** As between the parties, Customer retains all right, title, and interest in Customer Data. Provider acquires no rights in Customer Data except the limited rights granted in this Agreement to provide and improve the Services.

5.3 **Processing scope.** Provider processes Customer Data solely to deliver the Services, comply with applicable law, and (where Customer opts in) contribute to anonymized cross-tenant patterns as described in the DPA §10.

5.4 **Subprocessors.** Provider's current subprocessors are listed in [SUBPROCESSORS.md](SUBPROCESSORS.md). Provider will notify Customer at least **30 days** before engaging a new subprocessor that processes Customer Data or Personal Data, subject to the terms in that document.

5.5 **Data residency.** The primary Azure region for Customer Data is specified in the Order Form or security pack, as described in [SUBPROCESSORS.md](SUBPROCESSORS.md) §Data residency.

5.6 **Data return and deletion.** At termination, Customer may export Customer Data using product features (e.g., DOCX/ZIP exports, audit CSV) subject to RBAC. Provider deletes remaining Customer Data within the period specified in the DPA §9.

---

## 6. Security

6.1 **Security program.** Provider maintains a security program described in the [Trust Center](../trust-center.md) and related documentation. The program includes technical and organizational measures appropriate to the nature, scope, and purposes of processing.

6.2 **Authentication.** The Services authenticate Authorized Users via Microsoft Entra ID (all tiers). Enterprise-tier customers may use generic OIDC identity providers when available per the product roadmap. Customer is responsible for the security of its identity provider configuration.

6.3 **Encryption.** Provider encrypts Customer Data in transit (TLS 1.2 or higher) and at rest (Azure platform encryption). Key management follows Provider's security documentation linked from the [Trust Center](../trust-center.md).

6.4 **Tenant isolation.** Each Workspace is logically isolated. Provider's tenant isolation model is described in [TENANT_ISOLATION.md](TENANT_ISOLATION.md).

6.5 **Incident response.** Provider will notify Customer of security incidents in accordance with the DPA §8 and [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md). Notification timelines follow applicable law (including 72 hours where GDPR Article 33 applies).

6.6 **Compliance attestations.** Provider's current and planned compliance attestations (including SOC 2 roadmap) are described in the [Trust Center](../trust-center.md). Provider will make audit reports available under NDA when available.

6.7 **Customer obligations.** Customer is responsible for: (a) configuring its identity provider and RBAC roles appropriately; (b) ensuring Authorized Users comply with acceptable use requirements; (c) securing its own network and endpoint environments; and (d) promptly notifying Provider of any suspected security incident originating from Customer's environment.

---

## 7. Intellectual property

<<LEGAL REVIEW REQUIRED>>

7.1 **Provider IP.** Provider retains all Intellectual Property Rights in the Services, Documentation, Finding Engines, underlying algorithms, models, software, and all improvements or derivative works thereof. Nothing in this Agreement transfers or assigns any Provider IP to Customer.

7.2 **Customer IP.** Customer retains all Intellectual Property Rights in Customer Data and any pre-existing materials Customer provides in connection with the Services.

7.3 **Output ownership.** Manifests, findings, and other outputs generated by the Services from Customer Data are part of Customer Data for purposes of ownership under §5.2. Provider retains rights in the underlying algorithms and models that produced those outputs.

7.4 **Feedback.** If Customer provides suggestions, enhancement requests, or other feedback regarding the Services, Provider may use that feedback without restriction or obligation. Customer is not required to provide feedback.

7.5 **AI-generated content.** Certain outputs of the Services include content generated or augmented by large language models. Such content is decision support material, not a legal attestation or formal verification — see [Executive Sponsor Brief](../EXECUTIVE_SPONSOR_BRIEF.md) §9. Customer is responsible for reviewing and validating AI-generated content before relying on it.

7.6 **Cross-tenant patterns.** Where Customer opts into the anonymized cross-tenant pattern feature described in the DPA §10, Provider's use of Customer's anonymized structural contributions is governed by the DPA. Provider does not acquire ownership of Customer Data through that feature.

---

## 8. Limitation of liability

<<LEGAL REVIEW REQUIRED>>

8.1 **Exclusion of consequential damages.** To the maximum extent permitted by applicable law, neither party shall be liable to the other for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or business opportunity, arising out of or related to this Agreement, regardless of the theory of liability (contract, tort, strict liability, or otherwise) and even if the party has been advised of the possibility of such damages.

8.2 **Liability cap.** Each party's total aggregate liability arising out of or related to this Agreement shall not exceed the total fees paid or payable by Customer under the applicable Order Form during the **twelve (12) months** immediately preceding the event giving rise to the claim.

8.3 **Exceptions to cap.** The limitations in §8.1 and §8.2 do not apply to: (a) either party's indemnification obligations under §8.5; (b) Customer's payment obligations; (c) either party's breach of confidentiality obligations (except for claims related to Customer Data, which are governed by the DPA); or (d) liability that cannot be limited under applicable law.

8.4 **Warranty disclaimer.** Except as expressly stated in this Agreement, the Services are provided **"as is"** and **"as available."** Provider disclaims all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising from course of dealing or usage of trade.

8.5 **Indemnification.** <<LEGAL REVIEW REQUIRED>>

(a) **Provider indemnity.** Provider shall defend Customer against third-party claims alleging that Customer's authorized use of the Services infringes that third party's Intellectual Property Rights, and shall indemnify Customer for damages finally awarded (or amounts agreed in settlement) arising from such claims. Provider's obligations do not apply to claims arising from: (i) Customer Data; (ii) modifications to the Services not made by Provider; (iii) combination of the Services with non-Provider products or services; or (iv) use of the Services in violation of this Agreement or the Documentation.

(b) **Customer indemnity.** Customer shall defend Provider against third-party claims arising from Customer Data or Customer's use of the Services in violation of this Agreement, and shall indemnify Provider for damages finally awarded (or amounts agreed in settlement) arising from such claims.

(c) **Indemnification procedure.** The indemnified party must: (i) promptly notify the indemnifying party; (ii) grant the indemnifying party sole control of the defense and settlement; and (iii) provide reasonable cooperation at the indemnifying party's expense. The indemnifying party shall not settle any claim in a manner that imposes obligations on the indemnified party without prior written consent.

---

## 9. Term and termination

9.1 **Term.** This Agreement is effective as of the Effective Date and continues until all Order Forms have expired or been terminated, unless earlier terminated under this section.

9.2 **Subscription Term.** Each Order Form specifies its Subscription Term. Unless either party provides written notice of non-renewal at least **30 days** before the end of the then-current Subscription Term, the Order Form renews for successive periods equal to the original Subscription Term (or **one year**, whichever is shorter) at Provider's then-current list prices.

9.3 **Termination for cause.** Either party may terminate this Agreement (or an individual Order Form) if the other party: (a) commits a material breach and fails to cure it within **30 days** after written notice specifying the breach; or (b) becomes insolvent, files for bankruptcy, or has a receiver appointed for a substantial part of its assets.

9.4 **Termination for convenience by Customer.** Customer may terminate an Order Form for convenience by providing **60 days'** written notice. Fees paid for the remainder of the then-current Subscription Term are **not** refundable, except where applicable law requires otherwise or as negotiated in the Order Form.

9.5 **Effect of termination.** Upon termination or expiration: (a) Customer's access to the Services ceases; (b) Customer may export Customer Data during a **30-day** post-termination wind-down period (subject to RBAC); (c) Provider deletes remaining Customer Data per the DPA §9; and (d) accrued payment obligations survive.

9.6 **Survival.** Sections that by their nature should survive termination shall survive, including: Definitions (§1), Data Processing (§5), Intellectual Property (§7), Limitation of Liability (§8), Confidentiality (within §1 definition and any related exhibit), and General Provisions (§10).

---

## 10. General provisions

10.1 **Governing law.** <<LEGAL REVIEW REQUIRED>> This Agreement is governed by the laws of **[state / jurisdiction]**, without regard to its conflict-of-laws principles.

10.2 **Dispute resolution.** <<LEGAL REVIEW REQUIRED>> The parties shall attempt to resolve disputes through good-faith negotiation. If unresolved within **30 days**, disputes shall be submitted to **[binding arbitration / courts of competent jurisdiction in specified venue]**.

10.3 **Notices.** Notices under this Agreement must be in writing and delivered to the address (physical or email) specified in the Order Form. Notices are effective upon receipt.

10.4 **Assignment.** Neither party may assign this Agreement without the other party's prior written consent, except that either party may assign this Agreement in connection with a merger, acquisition, or sale of all or substantially all of its assets, provided the assignee assumes all obligations under this Agreement.

10.5 **Force majeure.** Neither party is liable for delays or failures in performance resulting from causes beyond its reasonable control, including natural disasters, acts of government, pandemics, war, terrorism, labor disputes, or failures of third-party telecommunications or power supply. The affected party must provide prompt notice and use commercially reasonable efforts to mitigate the impact.

10.6 **Entire agreement.** This Agreement (including all Order Forms, the DPA, and any exhibits) constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior or contemporaneous agreements, representations, and understandings. Amendments must be in writing and signed by both parties.

10.7 **Severability.** If any provision of this Agreement is held invalid or unenforceable, the remaining provisions continue in full force and effect. The parties shall negotiate in good faith a replacement provision that achieves the original intent to the extent permitted by law.

10.8 **Waiver.** Failure to enforce any right under this Agreement does not constitute a waiver of that right. Waivers must be in writing and signed by the waiving party.

10.9 **Independent contractors.** The parties are independent contractors. This Agreement does not create a partnership, joint venture, agency, or employment relationship.

10.10 **Export compliance.** Customer shall comply with all applicable export control and sanctions laws in its use of the Services.

10.11 **Anti-corruption.** Neither party shall engage in any activity that would violate applicable anti-bribery or anti-corruption laws in connection with this Agreement.

10.12 **Counterparts.** This Agreement may be executed in counterparts, each of which is an original and all of which together constitute one agreement. Electronic signatures have the same effect as original signatures.

---

## Signature

| Customer | Provider |
|----------|----------|
| Name: | Name: |
| Title: | Title: |
| Date: | Date: |

---

## Related documents

| Doc | Use |
|-----|-----|
| [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Data Processing Agreement (incorporated by reference) |
| [SUBPROCESSORS.md](SUBPROCESSORS.md) | Current subprocessor list |
| [TRUST_CENTER.md](../trust-center.md) | Trust and security index |
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | Pricing tiers and locked prices |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Subscription order form template |
| [API_SLOS.md](../library/API_SLOS.md) | Service level objectives (authoritative targets) |
| [EXECUTIVE_SPONSOR_BRIEF.md](../EXECUTIVE_SPONSOR_BRIEF.md) | Product description and sponsor narrative |
| [TENANT_ISOLATION.md](TENANT_ISOLATION.md) | Tenant isolation model |
| [INCIDENT_COMMUNICATIONS_POLICY.md](INCIDENT_COMMUNICATIONS_POLICY.md) | Incident notification policy |
