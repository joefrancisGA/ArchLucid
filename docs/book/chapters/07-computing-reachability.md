> **Scope:** Chapter 7 revised draft for the book draft *Managing Azure Security with AI*, split from Chapter 6 on 2026-10-12. Author working text; not product documentation and not a description of any vendor's internals.
> **Status:** draft — revised (revision pass 1, 2026-10-10; split 2026-10-12)

# Chapter 7 — Computing and confirming reachability

**Spine:** [`../README.md`](../README.md) · **Outline:** [`../OUTLINE.md`](../OUTLINE.md)

> *Draft status: revised (revision pass 1, 2026-10-10; split 2026-10-12). Target 4,500 words. Facts about Azure networking behavior, property names, and defaults were checked against Microsoft documentation in October 2026; re-check them before submission.*

**Builds on:** Chapter 3 (the collector and the manifest, sections 3.3 and 3.5), Chapter 5 (the path graph, its search, and unmodeled controls, sections 5.3 and 5.6), Chapter 6 (kinds of reachability, PaaS exposure, and NSG evaluation, sections 6.2 to 6.5).

---

## The next hop that wasn't an answer

In this fictional scenario, the week after Chapter 6's review, Contoso's platform team was asked to confirm one sentence: the development spoke cannot reach `custdata`. They had a VM in that spoke, `dev-vm`, and they ran Network Watcher's next hop from it toward the private endpoint.

The result came back quickly. The next hop was the hub firewall, and the route table was `rt-spokes`. The ticket was updated to "firewall blocks the development spoke" and closed.

Next hop had not said that. It had named the route. Naming the device a packet is sent to is not the same as evaluating that device's rules, which section 7.4 sets out. The hub still had the rule allowing `10.0.0.0/8` to `10.0.0.0/8` on any port. Under the configuration the team had actually deployed, the broad rule meant the development spoke may be reachable, which is a configured answer, not a deny. The ticket had promoted a route lookup into a deny, and nobody had a record of which question was asked.

This chapter is about not making that promotion. Configured reachability has three answers, not two. Observation and intention are separate claims. Confirmation climbs a ladder, and it stops at the first rung that answers the question that was actually asked.

Chapter 6 asked, one layer at a time, whether a data-plane endpoint accepts traffic from a given place. This chapter puts the layers together. It computes configured reachability with three possible answers, turns the result into edges in the section 5.3 graph, collects evidence of what actually connected and what owners intended, and confirms the few paths that matter without breaking anything.

---

## 7.1 Computing configured reachability

Putting the layers together, the configured reachability of a data-plane endpoint from a source position comes down to a short list of questions:

**For a public endpoint:**

1. Is public network access enabled?
2. Does the service firewall admit the source (default action, IP rules, subnet rules with service endpoints, resource instance rules, trusted services)?

**For a private endpoint:**

1. Does a route exist from the source to the endpoint's private address (same network, peering, gateway, or forwarded through a firewall)?
2. If routed through a firewall, do its rules allow the flow?
3. If the subnet enforces NSGs on private endpoints, do they allow it?
4. Does the source's DNS resolve the service name to the private address? If not, the source uses the public endpoint instead, and the public questions apply.

**For a workload in a virtual network**, such as a VM or a container: the private endpoint questions, with the destination workload's NSGs in place of question 3.

Each answer is an observed fact (a property), a derived fact (an NSG evaluation), or a deterministic inference (a route through a firewall whose rules you evaluated, assuming nothing outside your collection interferes). Each `Unknown` is a gap.

### Three answers, not two

The private-endpoint questions, as code. Each step can stop with `reachable`, `notReachable`, or `indeterminate`, and indeterminate always carries a reason:

<!-- listing: lab/listings/python/ch06_reachability.py#private_reachability -->

```python
REACHABLE = "reachable"
NOT_REACHABLE = "notReachable"
INDETERMINATE = "indeterminate"

# Next hops that deliver straight to the destination network. Effective routes and
# Network Watcher's next hop tool name the same types differently, so accept both.
DIRECT_NEXT_HOPS = frozenset({
    "VnetLocal", "VNetPeering", "VNetGlobalPeering",
    "VirtualNetwork", "VirtualNetworkPeering",
})


@dataclass(frozen=True)
class Reach:
    result: str   # REACHABLE, NOT_REACHABLE, or INDETERMINATE
    reason: str


@dataclass(frozen=True)
class FirewallRule:
    name: str
    priority: int
    action: str
    protocol: str
    source: str
    destination: str
    ports: str


@dataclass(frozen=True)
class Firewall:
    address: str                       # the private IP that routes send traffic to
    network_rules: list[FirewallRule]
    has_application_rules: bool        # application rules aren't evaluated here


@dataclass(frozen=True)
class Position:
    address: str
    next_hop: dict | None              # effective route for the target; None if not collected
    resolves_private: bool | None      # the source's DNS answer; None if not collected


@dataclass(frozen=True)
class PrivateTarget:
    address: str                       # the private endpoint's IP address
    nsg_applies: bool | None           # subnet's private endpoint network policies
    nsg_rules: list[NsgRule] | None    # None if not collected


def firewall_decision(
    firewall: Firewall, source: str, target: str, port: int, protocol: str,
    tags: dict[str, list[str]],
) -> Reach:
    """Network rules only. A flow no network rule decides may still match an application rule."""
    for rule in sorted(firewall.network_rules, key=lambda r: r.priority):
        if rule.protocol not in ("*", protocol) or not port_matches(rule.ports, port):
            continue

        matches = (source_matches(rule.source, source, tags),
                   source_matches(rule.destination, target, tags))

        if None in matches:
            return Reach(INDETERMINATE, f"firewall rule {rule.name} uses an uncollected tag")

        if all(matches):
            result = REACHABLE if rule.action == "Allow" else NOT_REACHABLE
            return Reach(result, f"firewall network rule {rule.name}")

    if firewall.has_application_rules:
        return Reach(INDETERMINATE, "no network rule matched; application rules not evaluated")

    return Reach(NOT_REACHABLE, "the firewall denies what no rule allows")


def private_reachability(
    source: Position, target: PrivateTarget, port: int, protocol: str,
    firewalls: dict[str, Firewall], tags: dict[str, list[str]],
) -> Reach:
    """Configured reachability of a private endpoint from one position, or why it can't be told."""
    if source.resolves_private is None:
        return Reach(INDETERMINATE, "the source's DNS answer for the service name wasn't collected")

    if not source.resolves_private:
        return Reach(NOT_REACHABLE, "the source resolves the public address; evaluate that instead")

    if source.next_hop is None:
        return Reach(INDETERMINATE, "the source's effective routes weren't collected")

    hop = source.next_hop["nextHopType"]
    reasons = [f"next hop {hop}"]

    if hop == "None":
        return Reach(NOT_REACHABLE, "the effective route drops the traffic")

    if hop == "VirtualAppliance":
        firewall = firewalls.get(source.next_hop["nextHopIpAddress"])

        # A third-party appliance, or a firewall whose policy wasn't collected.
        if firewall is None:
            return Reach(INDETERMINATE, f"next hop {source.next_hop['nextHopIpAddress']} "
                                        "is an appliance whose rules weren't collected")

        decision = firewall_decision(firewall, source.address, target.address, port, protocol, tags)

        if decision.result != REACHABLE:
            return decision

        reasons.append(decision.reason)
    elif hop not in DIRECT_NEXT_HOPS:
        # VirtualNetworkGateway (on-premises or forced tunnel), Internet, and anything newer.
        return Reach(INDETERMINATE, f"next hop {hop} leads somewhere the model doesn't follow")

    if target.nsg_applies is None or (target.nsg_applies and target.nsg_rules is None):
        return Reach(INDETERMINATE, "the endpoint subnet's NSG settings weren't collected")

    if target.nsg_applies:
        access, rule = evaluate_inbound(target.nsg_rules, source.address, port, protocol, tags)

        if access == "Unknown":
            return Reach(INDETERMINATE, f"NSG rule {rule} uses an uncollected tag")

        if access == "Deny":
            return Reach(NOT_REACHABLE, f"NSG rule {rule}")

        reasons.append(f"NSG rule {rule}")
    else:
        reasons.append("NSG not applied to the private endpoint")

    return Reach(REACHABLE, "; ".join(reasons))


def reach_edge(position: str, endpoint: str, reach: Reach, citation: str) -> Edge | None:
    """A canReach edge for search. Indeterminate carries an unmodeled control (Chapter 5)."""
    if reach.result == NOT_REACHABLE:
        return None

    if reach.result == REACHABLE:
        return Edge(position, endpoint, "canReach", "derived", f"{citation}; {reach.reason}")

    control = UnmodeledControl("networkIndeterminate", position, endpoint, "network path",
                               reach.reason, citation)

    return Edge(position, endpoint, "canReach", "derived", citation, control)
```

The function returns indeterminate in two situations. The first is a control it doesn't evaluate: a next hop to an appliance whose rules weren't collected, an Azure Firewall flow that only an application rule could decide, or a next hop to a gateway. The second is a missing input: the source's DNS answer, its effective routes, or the endpoint subnet's NSG settings. A yes-or-no evaluator has to guess in both situations, and its guesses look exactly like answers.

The next hop comes from the source's **effective routes**, Azure's own resolution of system, BGP, and user-defined routes [S1]. The model doesn't recompute which route wins from route tables [S2, S1]. That's why missing effective routes make the answer indeterminate rather than sending the model to reconstruct them.

`reach_edge` turns the result into a `canReach` edge for the section 5.3 search. A reachable result is a plain edge. A not-reachable result is no edge. An indeterminate result is an edge carrying an unmodeled control (section 5.3), so any path through it is reported as "Insufficient evidence", with the reason as the assumption to check.

### What the model doesn't evaluate

Network engineers will ask what the model ignores. Here is the answer, in one place:

| Control | What the model does with it | Why |
|---------|-----------------------------|-----|
| Third-party network virtual appliance | Indeterminate | Its rules aren't in Azure's APIs, so the collector can't read them |
| Azure Firewall application rules | Indeterminate when no network rule decides the flow | FQDN targets resolve differently over time; the model evaluates network rules only |
| Azure Firewall DNAT rules | Not evaluated | The model evaluates flows to private endpoint addresses, not to the firewall's own addresses |
| Load balancer or Application Gateway in the path | Not evaluated; report such a target as indeterminate | `private_reachability` evaluates private endpoints only; frontends, backend pools, and listener rules aren't read |
| Forced tunnel or on-premises route (gateway next hop) | Indeterminate | The far side of the gateway isn't collected |
| Missing effective routes or NSG settings | Indeterminate | An absent input isn't an allow or a deny |
| Custom DNS servers | Indeterminate unless the source's answer was collected | Their answers depend on servers and forwarders outside Azure's configuration |
| Asymmetric routing | Not evaluated | The model checks the forward path only, not whether return traffic takes a path that allows it |
| Route precedence (user-defined, BGP-propagated, system) | Not recomputed | The model reads effective routes, which already reflect that choice |
| Service endpoint policies | Not evaluated | The model doesn't read them |
| Private Link beyond private endpoints (Private Link service, network security perimeter) | Not evaluated | `private_reachability` handles private endpoints; `storage_public_exposure` returns `unknown` for `SecuredByPerimeter` |
| Connections already open when a rule changed | Not evaluated | The model evaluates a new connection against current rules |

Rows marked "not evaluated" don't produce indeterminate automatically. Whoever runs the model has to know they apply. That's why the table belongs in every network report that uses the model, next to the gap list.

### Network edges in the path graph

The identity graph has typed, cited edges, and its search walks only edges that mean "can" (section 5.3). Network reachability fits the same model in two ways.

**As a derived edge.** `canReach` from a position node (Internet, a subnet, on-premises) to an endpoint node (a resource's public or private endpoint), with the port and the evidence that decided it. Like `canControlCode` (section 4.3), it's derived from evidence-only facts: properties, rules, routes. The search never walks raw NSG rules.

**As a condition on data-plane edges.** The list-keys hop on the payments paths (H7) says "Contributor can list `custdata`'s keys, and shared key access is enabled, so the holder can read its blob data." With network evidence, that becomes a set of `grants` edges, one per position from which the blob endpoint is reachable:

| Position | Reachable? | Evidence |
|----------|-----------|----------|
| Internet | Yes | `publicNetworkAccess` Enabled, `defaultAction` Allow (observed) |
| Payments spoke | Yes | Private endpoint, same network, NSG policies off (derived) |
| Development spoke | Yes | Peered to hub; firewall rule `10.0.0.0/8` → `10.0.0.0/8` allows any port (deterministic inference) |
| On-premises | Unknown | On-premises DNS forwarding not collected (gap) |

The identity path didn't change. Its **reach** did: the holder of the key can use it from anywhere. Disabling public network access on `custdata` would remove the first row, so a key leaked outside Contoso's networks would stop working, without touching a single role assignment. That's a network cut point, which section 11.3 weighs against the identity ones.

### Collecting the inputs

The collector already reads storage accounts (section 3.3). Reachability needs more, all available to Reader through Azure Resource Graph or ARM:

- PaaS resources with their `publicNetworkAccess`, firewall rules, and private endpoint connections,
- virtual networks, subnets (with route table, NSG, service endpoints, and private endpoint network policies), and peerings,
- NSGs with their rules, route tables with their routes,
- private endpoints, private DNS zones, and their virtual network links,
- firewalls and firewall policies with rule collections,
- public IP addresses and what they're attached to,
- service tag prefixes, from Microsoft's published list, with its version.

Treat anything you can't read, such as a firewall policy in a subscription the collector can't see, as a gap that makes dependent edges `Unknown`. A hub you can't read makes every spoke-to-spoke answer unknown, and the report should say so.

---

## 7.2 Observed reachability

Configuration says what can happen. To say what did, you need logs that record connections. Azure has several, at different layers:

- **Virtual network flow logs** record flows through a virtual network, with source and destination addresses, ports, and whether the flow was allowed [S3]. They replace the older **NSG flow logs**, which Microsoft is retiring: new NSG flow logs can't be created after June 30, 2025, and existing ones stop working after September 30, 2027 [S4, S5].
- **Azure Firewall logs** record flows the firewall allowed or denied, and which rule decided.
- **Resource logs on PaaS services** record requests to the service itself. For storage, the blob logs include the caller's IP address, the operation, and the authentication type. That's the most direct evidence of who reached `custdata` and from where.
- **Traffic Analytics** summarizes flow logs into a queryable workspace.

Observed reachability answers questions configuration can't:

- **Is the public path in use?** If `custdata`'s blob logs show requests from public addresses, someone relies on the public endpoint. Disabling it will break them, and you need to find out who first. If the logs show only private addresses over a representative period, disabling public access is low-risk. This is the precondition check that remediation drafts list (section 9.7).
- **Is a firewall rule used?** If the broad `10.0.0.0/8` rule has matched only a handful of specific flows in ninety days, you can replace it with rules for those flows.
- **Does the model match reality?** Any observed flow your configured model says is impossible is a defect to investigate.

Two cautions, both from Chapter 2:

- **No log is not no traffic.** "We saw no public requests" means something only if logging was enabled for the whole period, on every relevant sub-resource, and the logs were retained. Record that as part of the observation, and treat missing logging as a gap.
- **Observed is not authorized.** A flow in the logs shows that a connection happened. It doesn't show that it was legitimate. Which flows should happen is intended reachability, and it comes from people.

Observation costs money. Flow logs and resource logs generate storage and ingestion charges, sometimes large ones. Start with the resources at the ends of your most important paths: the customer data stores, the key vaults, the management ports. Then expand. Logging everything everywhere before you know which questions you're asking is a common way to spend a budget without answering them.

---

## 7.3 Intended reachability

Intended reachability is a human assertion: "`custdata` should be reached only by the payments application, through its private endpoint." It's the baseline every configured and observed fact is compared against, and it's usually the hardest to obtain, because nobody wrote it down.

Some practical ways to collect it:

- **Ask owners for a short statement per sensitive resource**, in the same form as a data classification (section 2.2): who asserted it, when, and when it expires. "Reached only from `snet-payments-app`, private endpoint only, asserted by the payments platform lead, 2026-10-01, expires 2027-04-01."
- **Encode common intents as policy.** Azure Policy can audit or deny public network access on storage, Key Vault, SQL, and many other services. A policy assignment is a machine-readable statement of intent, and its compliance results are a ready-made comparison between intended and configured reachability.
- **Use tags carefully.** A tag such as `network-intent=private` is convenient and easy to query. It's also a human assertion anyone with tag write can change, and text a pipeline reads (section 10.5). Record who set it, and never let a tag override configuration evidence.

Without intended reachability, the best you can report is configured reachability ranked by consequence. That's still useful. But the most valuable finding in this chapter, "this was meant to be private and isn't", needs the intent.

---

## 7.4 Confirming a path without breaking anything

Configured reachability says a path may exist. For the few paths that matter most, such as the one that reaches `custdata`, someone will want it confirmed. Confirmation is the only kind of reachability that involves touching the network, so climb a ladder, from least intrusive to most, and stop at the first rung that answers the question:

1. **Read-only diagnostics.** Network Watcher's effective security rules, effective routes, next hop, and IP flow verify [S5]. They send no traffic and change nothing.
   - *What they prove:* Azure's own evaluation of the NSG rules and routes for one network interface agrees, or disagrees, with the model. Next hop names the route and the route table that decided it.
   - *What they don't prove:* anything about a firewall's or appliance's rules (next hop only says traffic goes to the appliance) [S6], DNS, the destination service's own firewall, or whether anything listens on the port. IP flow verify tests TCP and UDP only, against the rules on a VM's network interface [S7].
2. **Connection troubleshoot from an existing resource at the source position**, such as a VM in the development spoke [S8]. It sends TCP or ICMP probes and reports reachable or unreachable, with the hops and any issues it found [S8].
   - *What it proves:* a connection could be opened from that resource to that destination and port, at that moment.
   - *What it doesn't prove:* that other sources in the same position get the same DNS answer, that the destination accepts the caller's identity, or anything about another time. It does send traffic, so treat it as a test, not a lookup.
3. **A deliberate test connection.** Only after the first two, and only when the question still matters: for example, a request from the source to the service name, recording what the name resolved to (section 6.5).
   - *What it proves:* exactly what was tested, and nothing broader.

Every rung, including the first, needs written authorization from the network owner. The diagnostics change nothing, but they require Network Watcher actions beyond the Reader role (for example `Microsoft.Network/networkWatchers/ipFlowVerify/action`, `Microsoft.Network/networkWatchers/securityGroupView/action`, and `Microsoft.Network/networkWatchers/nextHop/action`) [S9], and they reveal network configuration to whoever runs them. Record each result as **confirmed**, with the date, source, destination, port, resolved address, the rung used, and who approved it. A confirmation with no record is an anecdote, which is what the laptop test in Chapter 6's opening story turned out to be.

> **As of 2026-10:** Network Watcher lists IP flow verify, NSG diagnostics, next hop, effective security rules, connection troubleshoot, packet capture, and VPN troubleshoot as its diagnostic tools [S5, S10]. IP flow verify checks NSG rules and Azure Virtual Network Manager admin rules for a VM's network interface [S7]. Next hop returns the next hop type, IP address, and route table ID [S6]. Its type names (`VirtualNetwork`, `VirtualNetworkPeering`) differ from the effective-routes API's (`VnetLocal`, `VNetPeering`) [S2, S6]. Connection troubleshoot sources are VMs, scale sets, Bastion hosts, and Application Gateway v2 [S8]. Its agentless mode is in preview; without it, the source VM needs the Network Watcher agent extension, and installing that is itself a change to the VM [S8]. Re-check these before relying on them.

---

## 7.5 Where AI fits

Network configuration is dense, repetitive, and full of numbers. That makes it a natural place to try a language model, and a dangerous one.

**Explanation works well.** Given an evaluated result with citations, a model can turn it into prose people can act on:

> `custdata` can be reached from the internet, because public network access is enabled and its firewall allows all networks [N1]. The private endpoint added in the hardening project gives the payments app a private path [N2], but doesn't close the public one. Disabling public network access would remove internet reachability [C2]. Blob logs aren't enabled, so we can't tell whether anyone currently uses the public endpoint [G1].

That's the grounding pattern (section 9.2), and it works for the same reasons. The model is narrating results computed elsewhere.

**Translating rules into intent works, with review.** A model can read a long NSG or firewall rule set and suggest what each rule is for ("rules 200 to 240 appear to allow the monitoring agents"). Treat those suggestions as AI inferences, label them, and confirm them with owners before they become intended reachability.

**Evaluation fails.** Don't ask a model whether `10.20.4.7` falls inside `10.20.0.0/20`, which rule wins between priorities 300 and 310, or which route applies to a given prefix. These are exact computations on numbers. Models get them wrong often enough to matter, and confidently. The code in section 6.4 is short and always right on the cases it handles, and it reports the ones it can't.

**Reachability search fails** for the same reasons graph search does (section 4.7): it must be exhaustive and repeatable. A model asked "what can reach `custdata`?" from a pile of NSG exports will find some routes and invent others.

The rule from earlier chapters holds: compute reachability deterministically, label every result with its evidence category, and use the model to explain.

---

## 7.6 Lab: what can reach `custdata`?

This lab reproduces Chapter 6's opening story and separates its four kinds of reachability. It uses the companion lab tenant (Appendix A), which includes `custdata` with a private endpoint in the payments spoke, public network access enabled, a hub firewall with a broad spoke-to-spoke rule, and a development spoke.

**Step 1 — Find unfinished private endpoints.** Run the query from section 6.3 against the lab tenant. Confirm that `custdata` appears, with public access enabled. Note any other rows, and for each, write down whether you think it's deliberate. That's an AI-free intended-reachability exercise: you're the human making the assertion.

**Step 2 — Classify public exposure.** Extend the Chapter 3 collector to save PaaS network properties, then run `storage_public_exposure` over every storage account in the snapshot. List each account's classification with its reasons. Confirm `custdata` comes back as "internet".

**Step 3 — Collect the network.** Add virtual networks, subnets, peerings, NSGs, route tables, private endpoints, private DNS zones and links, the firewall policy, and the current service tag file to the collector. Record any you can't read as gaps. Rewrite the manifest (section 3.5).

**Step 4 — Compute configured reachability.** For `custdata`'s blob endpoint, answer section 7.1's questions from four positions: internet, payments spoke, development spoke, and on-premises. Use `storage_public_exposure` for the internet row and `private_reachability` for the private positions. Produce the table from section 7.1, with an evidence category and a citation for every row. Write each row in section 6.2's safe wording, and list the indeterminate rows with their reasons. Evaluate the development spoke twice. By name, it resolves the public address (the private DNS zone isn't linked to it), so the private evaluation stops and the internet row applies. By address, it should come back "may be reachable under the modeled configuration", through the firewall's broad rule. That second answer is what anyone who uses the private address, or adds a zone link later, gets. The on-premises row should come back indeterminate if you have no gateway, or no collected far side.

**Step 4a (optional) — Ask Azure.** With the network owner's written approval (in the lab tenant, that's you, but write it down anyway), run Network Watcher's next hop and IP flow verify from `dev-vm` (`10.2.1.4`) toward the private endpoint (`10.1.2.4`), TCP port 443, outbound. Next hop should return `VirtualAppliance` with the firewall's private address, from route table `rt-spokes`. IP flow verify evaluates only `dev-vm`'s own NSG rules. Record the access result and the rule it names. Compare both with the model's answer. Neither tool evaluates the firewall's rules, so the firewall half of the model's answer is still configured, not confirmed. Record the result with section 7.4's fields.

**Step 5 — Check DNS.** From a VM in the development spoke and from your own machine, resolve `custdata.blob.core.windows.net` and record the address. Explain each result using the private DNS zone links you collected.

**Step 6 — Observe.** Enable blob resource logs on `custdata`, sending them to a Log Analytics workspace. Generate traffic from the payments Function App and from your own machine. Query the logs for caller IP addresses and authentication types. Confirm you can tell private-path requests from public-path requests.

**Step 7 — Connect to Chapter 5.** Add `canReach` edges to the identity graph from Chapter 5's lab, and make the `grants` edge for reading `custdata` conditional on the position. Re-run `find_paths` from an internet-positioned entry point and from a development-spoke entry point.

**Step 8 — Apply the network fix.** Disable public network access on `custdata`, re-collect, and re-compute. Confirm the internet row disappears, the Function App still works, and your request from Step 6 now fails. Then narrow the firewall rule to the flows the payments spoke actually needs, and confirm the development spoke row changes from "Yes" to "No".

**What you should see.** Before the fix, the identity path ends at "holds a key", and the key works from anywhere. After disabling public access, the same identity path still exists, but only from inside Contoso's networks. That shrinks who can use it, without changing any role. The DNS step usually produces at least one surprise. The observation step turns "we think nobody uses the public endpoint" into a fact with a time window, which is what makes the fix safe to apply.

---

## Sources

- **[S1]** Diagnose an Azure virtual machine routing problem. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/diagnose-network-routing-problem> Checked 2026-10-12. Kind: documented.
- **[S2]** Azure virtual network traffic routing. Microsoft Learn. <https://learn.microsoft.com/azure/virtual-network/virtual-networks-udr-overview> Checked 2026-10-12. Kind: documented.
- **[S3]** Virtual Network Flow Logs. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/vnet-flow-logs-overview> Checked 2026-10-12. Kind: documented.
- **[S4]** Quickstart: Configure NSG Flow Logs Using an ARM Template. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/nsg-flow-logs-template> Checked 2026-10-12. Kind: documented.
- **[S5]** Azure Network Watcher Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/network-watcher-monitoring-overview> Checked 2026-10-12. Kind: documented.
- **[S6]** Next Hop Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/next-hop-overview> Checked 2026-10-12. Kind: documented.
- **[S7]** IP Flow Verify Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/ip-flow-verify-overview> Checked 2026-10-12. Kind: documented.
- **[S8]** Connection Troubleshoot Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/connection-troubleshoot-overview> Checked 2026-10-12. Kind: documented.
- **[S9]** Azure RBAC Permissions - Azure Network Watcher. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/rbac-permissions> Checked 2026-10-12. Kind: documented.
- **[S10]** NSG Diagnostics Overview. Microsoft Learn. <https://learn.microsoft.com/azure/network-watcher/nsg-diagnostics-overview> Checked 2026-10-12. Kind: documented.

---

## Summary

- Reachability has **three answers**: reachable, not reachable, and **indeterminate**. Indeterminate, with a reason, is the honest result for appliances, application rules, gateways, and missing inputs. Publish the list of controls the model doesn't evaluate with every report.
- Model reachability as **derived `canReach` edges** and as **conditions on data-plane hops**. An indeterminate edge makes the whole identity path "Insufficient evidence". A network change can shrink an identity path's reach without touching roles.
- Use **flow logs, firewall logs, and resource logs** for observation, starting at the ends of important paths [S3]. No log is not no traffic.
- Collect **intended** reachability from owners and policy. Without it, the most valuable finding, "this was meant to be private and isn't", can't be made.
- Confirm important paths with the **confirmation ladder**: read-only diagnostics, then connection troubleshoot, then a deliberate test, each with written authorization and a record. Next hop and IP flow verify don't evaluate firewall rules.
- Use AI to **explain** reachability results. Never to evaluate CIDR ranges, rule priority, or routes, or to search for reachability.

## Key terms

- **Indeterminate (reachability)** — the result when an unmodeled control or a missing input sits on the route; always reported with its reason.
- **Confirmation ladder** — read-only diagnostics, then connection troubleshoot, then a deliberate test; each rung authorized in writing and recorded.

---

## Author notes (remove before submission)

- 2026-10-12 (chapter split): split from the old Chapter 5. Its sections 6 to 11 became sections 7.1 to 7.6. The listing it shows (`private_reachability`) stays in `ch06_reachability.py`, next to the exposure code it builds on.
- 2026-10-12 (opening story): "The next hop that wasn't an answer" uses the lab's route (`dev-vm`, `rt-spokes`, the hub firewall) and the limit of next hop already stated in section 7.4. It is fiction, in the same sense as the other opening stories. Still to verify: run section 7.6 Step 4a against the live lab and compare it with this story.
- 2026-10-12 (BR-10, repetition edit): recap and signpost references to other chapters were cut or turned into section pointers, and the **Builds on** line now carries the dependencies. No technical content, code, labs, or evidence categories changed. `tools/check_cross_refs.py` checks every reference.
- 2026-10-12 (network ladder): added `private_reachability` with a third result, indeterminate, which becomes an unmodeled control on a `canReach` edge (`reach_edge`), so Chapter 5 reports the path as "Insufficient evidence". Added the safe-wording table (section 6.2), the "doesn't evaluate" table (section 7.1), the confirmation ladder (section 7.4), and lab Step 4a. Network Watcher tool names, inputs, and next hop types checked against Microsoft Learn in October 2026. Still to verify: run Step 4a against the live lab. Chapter 9's activity-wording check doesn't yet flag unqualified "is reachable"; adding that pattern is a candidate if review drafts use it.
- Add the Chapter 7 fact checks to GTM **M-306** when it is picked up.
