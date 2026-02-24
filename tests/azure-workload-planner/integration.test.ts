/**
 * Integration Tests for azure-workload-planner
 * 
 * Tests skill behavior with a real Copilot agent session.
 * These tests require Copilot CLI to be installed and authenticated.
 */

import * as fs from "fs";
import * as path from "path";
import {
  useAgentRunner,
  isSkillInvoked,
  areToolCallsSuccess,
  doesAssistantMessageIncludeKeyword,
  shouldSkipIntegrationTests
} from "../utils/agent-runner";

const SKILL_NAME = "azure-workload-planner";

const describeIntegration = shouldSkipIntegrationTests() ? describe.skip : describe;

describeIntegration(`${SKILL_NAME} - Integration Tests`, () => {
  const agent = useAgentRunner();

  test("invokes skill for infrastructure planning prompt", async () => {
    const agentMetadata = await agent.run({
      prompt: "Create an Azure infrastructure plan for an event-driven serverless data pipeline"
    });

    const isSkillUsed = isSkillInvoked(agentMetadata, SKILL_NAME);
    expect(isSkillUsed).toBe(true);
  });

  test("response mentions infrastructure plan JSON", async () => {
    const agentMetadata = await agent.run({
      prompt: "Plan Azure infrastructure for a web application with a database"
    });

    const hasExpectedContent = doesAssistantMessageIncludeKeyword(
      agentMetadata,
      "infrastructure-plan.json"
    );
    expect(hasExpectedContent).toBe(true);
  });

  test("response mentions Bicep or Terraform", async () => {
    const agentMetadata = await agent.run({
      prompt: "Generate infrastructure as code for my Azure workload"
    });

    const hasBicep = doesAssistantMessageIncludeKeyword(agentMetadata, "Bicep");
    const hasTerraform = doesAssistantMessageIncludeKeyword(agentMetadata, "Terraform");
    expect(hasBicep || hasTerraform).toBe(true);
  });

  test("works with project files in workspace", async () => {
    const agentMetadata = await agent.run({
      setup: async (workspace: string) => {
        fs.writeFileSync(
          path.join(workspace, "package.json"),
          JSON.stringify({
            name: "my-api",
            dependencies: {
              "express": "^4.18.0",
              "@azure/cosmos": "^4.0.0"
            }
          })
        );
      },
      prompt: "What Azure infrastructure do I need for this project?"
    });

    expect(isSkillInvoked(agentMetadata, SKILL_NAME)).toBe(true);
  });
});
