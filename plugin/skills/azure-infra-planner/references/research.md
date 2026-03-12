# Research Phase

Gather all information needed to make correct infrastructure decisions before generating the plan. 

## Input Analysis

Determine the input scenario and gather requirements accordingly:

| Scenario | Action |
|----------|--------|
| **Repository analysis** | Scan project files: `package.json`, `requirements.txt`, `Dockerfile`, `*.csproj`, config files. Identify runtime, dependencies, and infrastructure needs. |
| **User requirements** | Ask user to describe their workload: purpose, expected traffic, data storage needs, security requirements, budget constraints. |
| **Multi-environment** | Ask which environments (dev/staging/prod) and how sizing differs between them. |

## MCP Tool Usage

### Architecture Research

Use `microsoft_docs_search` to find architecture guidance:
- Search for architecture patterns matching the workload type (e.g., "Azure web app architecture best practices")
- Extract recommended resource types and design patterns from results

### Well-Architected Framework Guidance

**IMPORTANT** You **MUST** call `wellarchitectedframework_serviceguide_get` for every planned Azure service (if the service exists in the MCP) early in research so WAF recommendations can influence architecture decisions. These decisions include extra resources or properties needed for security, monitoring, and Single-Point-of-Failures. Use subagents to execute this research.

The tool returns a **raw markdown URL**, not content. Handle the two cases:

1. **URL returned** — Spawn a subagent to summarize the content found and ask it to summarize important information 500 tokens or less. It can summarize better the more specific information you're seeking (cost, security, important properties, key principles).
2. **No guide available** — Fall back to `microsoft_docs_search` for WAF guidance. Use a subagent to summarize the content found and ask it to summarize important information 500 tokens or less. It can summarize better the more specific information you're seeking (cost, security, important properties).

### SKU and Region Availability

Use [resources](resources.md) and `microsoft_docs_search` and `microsoft_docs_fetch` if necessary to verify:
- Which regions support the selected resource types
- Available SKUs and their capabilities
- Service limits and quotas for target SKUs

## Research Checklist

For each resource in the plan, verify:

1. **Type** — Correct `Microsoft.*` resource type
2. **SKU** — Available in target region, appropriate for workload size
3. **Region** — Service available, data residency requirements met
4. **Name** — Complies with naming constraints
5. **Dependencies** — All prerequisite resources identified and ordered
6. **Properties** — Required properties populated per resource schema
7. **Alternatives** — At least one alternative considered with tradeoff documented
