# Requirements Brief: Connected Factory Predictive Maintenance

## 1. Purpose

Forgeworks Manufacturing operates 18 factories with CNC machines, conveyor systems, and industrial pumps. It needs a platform that collects telemetry, identifies emerging equipment problems, and creates maintenance recommendations without directly controlling machinery.

Safety and production continuity matter more than analytics novelty. The system may recommend action; a qualified human authorizes all maintenance work.

## 2. Scope

**In scope:** edge telemetry collection, local buffering, cloud ingestion, time-series storage, anomaly detection, maintenance recommendation, CMMS integration, fleet monitoring, and model/version governance.

**Out of scope:** real-time machine control, safety interlocks, replacement of the plant SCADA system, and autonomous work-order approval.

## 3. Functional requirements

| ID | Priority | Requirement |
|---|---:|---|
| FR-01 | P0 | Collect vibration, temperature, power, and operating-state telemetry from up to 20,000 assets. |
| FR-02 | P0 | Continue local collection during a site network outage and forward data in order when connectivity returns. |
| FR-03 | P0 | Generate a recommendation with asset, observed evidence, confidence, applicable model/rule version, and required human review. |
| FR-04 | P0 | Integrate approved recommendations with the existing CMMS through a controlled API. |
| FR-05 | P1 | Enable local plant engineers to see current ingestion health and backlog without access to other plants. |
| FR-06 | P1 | Support model rollback and a disable switch that stops recommendations while preserving telemetry collection. |

## 4. Quality attributes and constraints

| Area | Mandatory requirement |
|---|---|
| Edge resilience | Each site must buffer 72 hours of telemetry during a WAN outage without loss under normal sampling rates. |
| Latency | Urgent anomalies must be visible to the local maintenance team within 5 minutes of observation when the WAN is available. |
| Availability | Cloud fleet services: 99.9% monthly. Edge collection must function independently of cloud availability. |
| Safety | The architecture must have no path from recommendation logic to machine actuation. Any CMMS action requires human approval. |
| Security | Segment operational technology (OT) networks from enterprise IT. Edge devices use unique workload identities and mutually authenticated communication. |
| Data integrity | Preserve source timestamp, gateway timestamp, sequence identity, and late-arrival state. Do not overwrite raw telemetry. |
| Scale | Normal load is 120,000 events/second; a plant restart can create a 5× burst for 20 minutes. |
| Retention | Raw telemetry: 30 days online and 2 years archive. Aggregated telemetry and maintenance history: 10 years. |
| Operations | Show site connectivity, gateway health, buffer depth, clock skew, model version, dropped-event count, and CMMS delivery status. |
| Cost | A target architecture should identify the top three cost drivers and a way to cap each one. |

## 5. Known facts

- Three factory sites have unstable WAN links; disconnections of 2–8 hours occur monthly.
- Legacy equipment speaks a mixture of OPC UA, Modbus, and vendor-specific protocols.
- Some sites cannot receive routine operating-system patches more often than quarterly.
- The CMMS is SaaS-based and enforces a rate limit of 100 API calls/minute per tenant.
- Local technicians need access during a cloud outage, but their handheld devices cannot store long-term raw telemetry.

## 6. Decisions required / incomplete evidence

- Exact OT security-zone model and remote support method are not approved.
- Whether model inference runs at the edge, centrally, or in a hybrid mode is deliberately open.
- The false-positive rate that maintenance leaders will accept is not yet defined.
- Data sovereignty for two future non-U.S. plants is unknown.

## 7. Architecture deliverables requested

Produce an edge-to-cloud architecture with plant boundaries, OT/IT separation, offline buffering, raw and derived data flows, inference locations, CMMS approval integration, and fleet operations. Call out safety invariants and propose failure-injection tests for WAN loss, delayed data, clock skew, and CMMS rate limiting.
