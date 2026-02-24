/**
 * Unit Tests for azure-workload-planner
 * 
 * Test isolated skill logic and validation rules.
 */

import { loadSkill, LoadedSkill } from "../utils/skill-loader";

const SKILL_NAME = "azure-workload-planner";

describe(`${SKILL_NAME} - Unit Tests`, () => {
  let skill: LoadedSkill;

  beforeAll(async () => {
    skill = await loadSkill(SKILL_NAME);
  });

  describe("Skill Metadata", () => {
    test("has valid SKILL.md with required fields", () => {
      expect(skill.metadata).toBeDefined();
      expect(skill.metadata.name).toBe(SKILL_NAME);
      expect(skill.metadata.description).toBeDefined();
      expect(skill.metadata.description.length).toBeGreaterThan(10);
    });

    test("description is concise and actionable", () => {
      expect(skill.metadata.description.length).toBeGreaterThan(50);
      expect(skill.metadata.description.length).toBeLessThan(1000);
    });

    test("description contains trigger phrases", () => {
      const description = skill.metadata.description.toLowerCase();
      const hasTriggerPhrases =
        description.includes("use for") ||
        description.includes("use when") ||
        description.includes("helps") ||
        description.includes("activate") ||
        description.includes("trigger");
      expect(hasTriggerPhrases).toBe(true);
    });

    test("description contains anti-trigger phrases", () => {
      const description = skill.metadata.description.toLowerCase();
      expect(description).toContain("do not use for");
    });
  });

  describe("Skill Content", () => {
    test("has substantive content", () => {
      expect(skill.content).toBeDefined();
      expect(skill.content.length).toBeGreaterThan(100);
    });

    test("documents research phase", () => {
      expect(skill.content).toContain("Research");
      expect(skill.content).toContain("mcp_azure_mcp_cloudarchitect");
      expect(skill.content).toContain("mcp_azure_mcp_quota");
    });

    test("documents plan generation phase", () => {
      expect(skill.content).toContain("Plan Generation");
      expect(skill.content).toContain("infrastructure-plan.json");
    });

    test("documents IaC generation phase", () => {
      expect(skill.content).toContain("IaC Generation");
      expect(skill.content).toContain("Bicep");
      expect(skill.content).toContain("Terraform");
    });

    test("documents deployment phase", () => {
      expect(skill.content).toContain("Deployment");
      expect(skill.content).toContain("az deployment group create");
      expect(skill.content).toContain("terraform apply");
    });

    test("documents status lifecycle", () => {
      expect(skill.content).toContain("Status Lifecycle");
      expect(skill.content).toContain("draft");
      expect(skill.content).toContain("approved");
      expect(skill.content).toContain("deployed");
    });

    test("documents naming conventions reference", () => {
      expect(skill.content).toContain("naming-conventions.md");
    });

    test("documents plan-first workflow gate", () => {
      expect(skill.content).toContain("PLAN-FIRST WORKFLOW");
      expect(skill.content).toContain("STOP HERE");
    });

    test("lists all required MCP tools", () => {
      const requiredTools = [
        "mcp_azure_mcp_cloudarchitect",
        "mcp_azure_mcp_bicepschema",
        "mcp_azure_mcp_deploy",
        "mcp_azure_mcp_quota",
        "mcp_azure_mcp_documentation",
        "mcp_azure_mcp_subscription_list",
        "mcp_azure_mcp_group_list",
        "mcp_azure_mcp_role",
      ];
      for (const tool of requiredTools) {
        expect(skill.content).toContain(tool);
      }
    });
  });
});
