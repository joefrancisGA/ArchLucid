using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Templates;

public static partial class ArchitectureRequestTemplates
{
    public static ArchitectureRequest MicroservicesWebPlatform(string? requestId = null)
    {
        return Build("microservices-web-platform", requestId, "Microservices web platform", """
                                                                                            Design a baseline microservices platform for customer-facing web workloads. The north-south edge is an API gateway;
                                                                                            core domains are expressed as independently deployable services. All east-west traffic must use TLS.
                                                                                            Produce a target topology, data ownership boundaries, and operational concerns (observability, rollout, secrets).
                                                                                            """, "MicroservicesWebPlatform", "prod", CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Kubernetes is the preferred runtime; cloud control plane is Azure-aligned (Azure Kubernetes Service or equivalent).",
                "PostgreSQL is the system of record; Redis is used for caching and ephemeral coordination."
            ],
            [
                "East-west service calls must use HTTPS (TLS) — no cleartext on the mesh or cluster network.",
                "No more than four domain services in the first delivery increment (gateway + three domains as listed)."
            ],
            [
                "API gateway (ingress, authn delegation, rate limits)", "User, order, and notification domain services", "PostgreSQL and Redis",
                "Kubernetes deployment with rolling updates"
            ], [
                ("Evidence — API Gateway", """
                                           **Component:** Edge API gateway (e.g. ingress controller + policy layer).

                                           **Role:** TLS termination for external clients, request routing to domain services, authentication passthrough
                                           or token validation, coarse rate limiting. Must not become a shared datastore or workflow orchestrator.
                                           """),
                ("Evidence — User Service", """
                                            **Component:** User / identity profile service (bounded context).

                                            **Role:** Owns user profiles, preferences, and account lifecycle events. Exposes HTTPS-only APIs;
                                            persists authoritative user state in PostgreSQL; publishes integration events when profiles change.
                                            """),
                ("Evidence — Order Service", """
                                             **Component:** Order fulfillment service.

                                             **Role:** Owns order aggregates, pricing snapshots as referenced at order time, and fulfillment state transitions.
                                             Uses PostgreSQL as source of truth; coordinates with notification service for async customer comms.
                                             """),
                ("Evidence — Notification Service", """
                                                    **Component:** Notification / outbound communications service.

                                                    **Role:** Consumes domain events (email/SMS/push adapters). At-least-once delivery acceptable with idempotent
                                                    handlers; dead-letter path for poison messages. No direct coupling to order tables — contract via events/API.
                                                    """),
                ("Evidence — Datastores and platform", """
                                                       **PostgreSQL:** System of record for durable domain state; per-service schemas or databases with clear ownership.

                                                       **Redis:** Cache, session ephemeral state, or short-lived locks — not a substitute for transactional guarantees.

                                                       **Kubernetes:** Workload orchestration, horizontal scaling, secrets via platform integration; pod-to-pod traffic
                                                       encrypted (service mesh or equivalent) to satisfy HTTPS-between-services intent for internal calls.
                                                       """)
            ], ["microservices", "kubernetes", "api-gateway", "postgres", "redis", "tls-east-west"],
            ["tls-everywhere", "least-privilege-service-accounts", "no-cleartext-internal-rpc"]);
    }

    public static ArchitectureRequest EventDrivenProcessingPipeline(string? requestId = null)
    {
        return Build("event-driven-processing-pipeline", requestId, "Event-driven processing pipeline", """
                                                                                                        Architect a high-throughput event pipeline: ingestion from producers through a durable log (Kafka-style or cloud event hub),
                                                                                                        stream processing, and fan-out to multiple consumers. Address ordering, replay, idempotency, exactly-once *effects*
                                                                                                        (end-to-end guarantees), poison-message handling, and observability across stages.
                                                                                                        """, "EventProcessingPipeline", "prod",
            CloudProvider.Azure,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "Cross-region disaster recovery is a later phase unless stated in constraints.",
                "Consumers may be owned by different teams with independent release cycles."
            ],
            [
                "Dead-letter queues or topics must exist for every subscription with automated replay tooling defined.",
                "Sensitive payloads must be encrypted at rest in the log and access-controlled via IAM."
            ],
            [
                "Ordered partitions where the business key requires ordering", "At-least-once delivery to consumers with idempotent handlers",
                "Exactly-once or effectively-once side effects for financial adjacency (where required)",
                "Stream aggregation windows for near-real-time metrics"
            ], [
                ("Evidence — Ingestion bus", """
                                             **Ingestion:** Durable partitioned log (e.g. Kafka, Azure Event Hubs). Producers publish keyed events for affinity.

                                             **Ops:** Throughput sizing, retention policy, and compaction strategy documented.
                                             """),
                ("Evidence — Stream processors", """
                                                 **Processing:** Stateful stream jobs (windows, joins) with checkpointed offsets; replay from last committed state.

                                                 **Failure:** Job restarts must not duplicate monetary side effects without compensating controls.
                                                 """),
                ("Evidence — Consumer fleet", """
                                              **Consumers:** Multiple subscriber groups / applications with heterogeneous SLAs.

                                              **Back-pressure:** Slow consumers must not block the log — scale independently; monitor consumer lag.
                                              """),
                ("Evidence — Delivery semantics", """
                                                  **Semantics:** Document per use case: at-most-once, at-least-once with idempotency keys, or transactional outbox
                                                  patterns bridging DB commits and event publication.

                                                  **Reconciliation:** Periodic audit jobs compare source-of-truth vs. projections.
                                                  """),
                ("Evidence — Dead-letter handling", """
                                                    **DLQ:** Malformed or repeatedly failing messages routed to a DLQ with alerting, manual triage UI, and replay API.

                                                    **Poison detection:** Threshold-based circuit breaking to protect shared dependencies.
                                                    """)
            ], ["event-sourcing-adjacent", "cqrs-read-models", "partitioned-log", "consumer-groups"],
            ["encrypt-events-at-rest", "fine-grained-publish-subscribe-iam"]);
    }

    public static ArchitectureRequest AwsMicroservicesECommerce(string? requestId = null)
    {
        return Build("aws-microservices-ecommerce", requestId, "AWS microservices e-commerce platform", """
                Design a customer-facing e-commerce platform on AWS with independently deployable services behind an edge API layer.
                North-south traffic terminates at an Application Load Balancer or API Gateway; core domains (catalog, cart, checkout, notifications)
                communicate over private subnets with TLS everywhere. Document data ownership, event-driven integration (SQS/SNS or EventBridge),
                RDS/Aurora persistence, ElastiCache for session/cache tiers, and operational guardrails (observability, secrets, least-privilege IAM).
                """, "AwsCommerceMesh", "prod", CloudProvider.Aws,
            [
                "Workspace and project scope are taken from the signed-in operator session (default workspace and project).",
                "EKS or ECS/Fargate is acceptable when container orchestration is required; serverless paths must document cold-start trade-offs.",
                "Aurora PostgreSQL is the preferred system of record unless DynamoDB ownership is explicit per aggregate."
            ],
            [
                "No public database endpoints — RDS and ElastiCache reachable only from approved VPC subnets or security groups.",
                "At-least-once messaging with idempotent consumers and documented DLQ replay procedures."
            ],
            [
                "API Gateway or ALB ingress with WAF where internet-facing",
                "Catalog, cart, checkout, and notification services with clear bounded contexts",
                "Aurora PostgreSQL and ElastiCache",
                "SQS/SNS or EventBridge for async integration",
                "IAM roles for service-to-service access — no long-lived access keys in application config"
            ], [
                ("Evidence — Edge and API layer", """
                                             **Ingress:** ALB or API Gateway with TLS termination, request routing, and coarse rate limits.

                                             **Security:** WAF managed rules where the storefront is public; JWT validation at the edge or service mesh boundary.
                                             """),
                ("Evidence — Domain services", """
                                              **Services:** Catalog, cart, checkout, and notifications as independently deployable units with HTTPS-only APIs.

                                              **Ownership:** Each service owns its schema or DynamoDB table; no cross-service database joins in runtime paths.
                                              """),
                ("Evidence — Data and cache", """
                                             **Aurora:** Authoritative transactional state with automated backups and multi-AZ where policy requires.

                                             **ElastiCache:** Session and hot-read cache — not a substitute for transactional guarantees on checkout.
                                             """),
                ("Evidence — Messaging and operations", """
                                                     **Async:** SQS/SNS or EventBridge for integration events; poison-message handling and replay tooling documented.

                                                     **Ops:** CloudWatch metrics, structured logs, and X-Ray or equivalent tracing across synchronous and async paths.
                                                     """)
            ], ["aws-microservices", "eks-or-ecs", "aurora-postgres", "elasticache", "sqs-sns", "tls-east-west"],
            ["iam-least-privilege", "no-public-datastores", "waf-edge-where-public"]);
    }
}
