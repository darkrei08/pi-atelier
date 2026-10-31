import { describe, expect, it } from "vitest";
import { applyWorkflowEvent, runningAgentCount, type WorkflowRuns } from "../src/workflow-runs.js";

describe("workflow runs", () => {
	it("tracks started runs, phases, and agent states", () => {
		const runs: WorkflowRuns = new Map();
		const event = (channel: string, payload: Record<string, unknown>) =>
			applyWorkflowEvent(runs, channel, { ...payload, sessionId: "session-1" }, "session-1");

		expect(event("workflow:run-started", { runId: "run-1", workflowName: "Deploy" })).toBe(true);
		expect(runs.get("run-1")).toMatchObject({ name: "Deploy", state: "running" });
		expect(event("workflow:phase-changed", { runId: "run-1", phase: "build" })).toBe(true);
		expect(runs.get("run-1")?.phase).toBe("build");
		expect(
			event("workflow:agent-state-changed", { runId: "run-1", agentId: "agent-1", state: "running" }),
		).toBe(true);
		expect(
			event("workflow:agent-state-changed", {
				runId: "run-1",
				agentId: "agent-2",
				state: "waiting_for_child",
			}),
		).toBe(true);
		expect(
			event("workflow:agent-state-changed", { runId: "run-1", agentId: "agent-3", state: "completed" }),
		).toBe(true);
		expect(runningAgentCount(runs.get("run-1")!)).toBe(2);
	});

	it("removes runs on terminal state changes and completion events", () => {
		const runs: WorkflowRuns = new Map();
		const apply = (channel: string, runId: string, extra: Record<string, unknown> = {}) =>
			applyWorkflowEvent(runs, channel, { sessionId: "session-1", runId, ...extra }, "session-1");

		apply("workflow:run-started", "terminal");
		expect(apply("workflow:run-state-changed", "terminal", { state: "budget_exhausted" })).toBe(true);
		expect(runs.has("terminal")).toBe(false);

		apply("workflow:run-started", "completed");
		expect(apply("workflow:run-completed", "completed")).toBe(true);
		expect(runs.has("completed")).toBe(false);
	});

	it("ignores events belonging to another session or without a run ID", () => {
		const runs: WorkflowRuns = new Map();
		expect(
			applyWorkflowEvent(
				runs,
				"workflow:run-started",
				{ sessionId: "other-session", runId: "run-1", workflowName: "Deploy" },
				"session-1",
			),
		).toBe(false);
		expect(applyWorkflowEvent(runs, "workflow:run-started", { sessionId: "session-1" }, "session-1")).toBe(
			false,
		);
		expect(runs.size).toBe(0);
	});
});
