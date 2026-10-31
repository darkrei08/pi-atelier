/**
 * PiWorkflow publishes lifecycle events on Pi's event bus. Atelier keeps an
 * optional dependency on that package, so the channel names are duplicated here
 * instead of importing it; they are part of the published event contract.
 */
export const WORKFLOW_EVENT_CHANNELS = [
	"workflow:run-started",
	"workflow:run-state-changed",
	"workflow:run-completed",
	"workflow:run-failed",
	"workflow:phase-changed",
	"workflow:agent-state-changed",
] as const;

const TERMINAL_RUN_STATES: ReadonlySet<string> = new Set([
	"completed",
	"failed",
	"stopped",
	"interrupted",
	"budget_exhausted",
]);

const RUNNING_AGENT_STATES: ReadonlySet<string> = new Set(["running", "waiting_for_child", "retrying"]);

export interface WorkflowRunStatus {
	runId: string;
	name: string;
	state: string;
	phase?: string;
	/** Agent states by agent ID for this run. */
	agents: ReadonlyMap<string, string>;
}

export type WorkflowRuns = Map<string, WorkflowRunStatus>;

function record(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === "string" && value.trim() ? value : undefined;
}

function label(value: unknown, fallback: string): string {
	const text = stringValue(value) ?? fallback;
	return text
		.replace(/[\u0000-\u001f\u007f]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 48);
}

/**
 * Apply one PiWorkflow event. Returns whether the visible run set changed, so
 * callers repaint only when there is something new to show.
 */
export function applyWorkflowEvent(
	runs: WorkflowRuns,
	channel: string,
	payload: unknown,
	sessionId: string,
): boolean {
	const event = record(payload);
	if (!event || stringValue(event.sessionId) !== sessionId) return false;
	const runId = stringValue(event.runId);
	if (!runId) return false;
	const current = runs.get(runId);

	switch (channel) {
		case "workflow:run-started":
			runs.set(runId, {
				runId,
				name: label(event.workflowName, "workflow"),
				state: "running",
				agents: new Map(),
			});
			return true;
		case "workflow:phase-changed": {
			if (!current) return false;
			const phase = label(event.phase, "phase");
			runs.set(runId, { ...current, phase });
			return true;
		}
		case "workflow:agent-state-changed": {
			if (!current) return false;
			const agentId = stringValue(event.agentId);
			const state = stringValue(event.state);
			if (!agentId || !state) return false;
			const agents = new Map(current.agents);
			agents.set(agentId, state);
			runs.set(runId, { ...current, agents });
			return true;
		}
		case "workflow:run-state-changed": {
			if (!current) return false;
			const state = stringValue(event.state);
			if (!state) return false;
			if (TERMINAL_RUN_STATES.has(state)) {
				runs.delete(runId);
				return true;
			}
			runs.set(runId, { ...current, state });
			return true;
		}
		case "workflow:run-completed":
			if (!current) return false;
			runs.delete(runId);
			return true;
		case "workflow:run-failed":
			if (!current) return false;
			runs.delete(runId);
			return true;
		default:
			return false;
	}
}

export function runningAgentCount(run: WorkflowRunStatus): number {
	let count = 0;
	for (const state of run.agents.values()) {
		if (RUNNING_AGENT_STATES.has(state)) count += 1;
	}
	return count;
}
