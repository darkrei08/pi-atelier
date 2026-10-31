import { formatTokens } from "./metrics.js";
import { surfaceGlyphs } from "./glyphs.js";
import { sanitizeInline } from "./text.js";
import type { SidebarSnapshot } from "./sidebar.js";

export type SectionExpansion = Readonly<Record<string, boolean | undefined>>;

export function isSectionExpanded(expansion: SectionExpansion, id: string, defaultExpanded = true): boolean {
	return expansion[id] ?? defaultExpanded;
}

export function toggleSection(
	expansion: SectionExpansion,
	id: string,
	defaultExpanded = true,
): SectionExpansion {
	return { ...expansion, [id]: !isSectionExpanded(expansion, id, defaultExpanded) };
}

const ALERT_STATUS = /\b(error|failed?|failure|offline|unavailable|warn(?:ing)?|blocked|degraded)\b/i;

export function sectionDetailRows(snapshot: SidebarSnapshot, id: string): string[] {
	const metrics = snapshot.metrics;
	const rows: string[] = [];
	const add = (key: string, value: string | number | undefined | null) => {
		if (value === undefined || value === null || value === "") return;
		rows.push(`${key}: ${sanitizeInline(String(value))}`);
	};

	switch (id) {
		case "agent":
			add("Model", snapshot.modelId);
			add("Provider", snapshot.provider);
			add("Thinking", snapshot.thinkingLevel);
			if (snapshot.modelId || snapshot.provider)
				add("Billing", metrics.subscription ? "Subscription" : "Metered");
			break;
		case "context":
			if (metrics.contextTokens !== null) {
				add(
					"Tokens / window",
					`${formatTokens(metrics.contextTokens)} / ${formatTokens(metrics.contextWindow)}`,
				);
			}
			if (metrics.contextPercent !== null) add("Percent", `${metrics.contextPercent.toFixed(1)}%`);
			if (metrics.autoCompact !== null) add("Auto-compact", metrics.autoCompact ? "on" : "off");
			break;
		case "workspace": {
			const pulse = snapshot.workspacePulse;
			add("Branch", snapshot.branch);
			if ("data" in pulse) {
				const { trackedFiles, untrackedFiles } = pulse.data.snapshot;
				add("Changed files", trackedFiles + untrackedFiles);
				add("Dirty", pulse.status === "clean" ? "no" : "yes");
			}
			break;
		}
		case "usage":
			if (metrics.usageAvailable) {
				add("Input", formatTokens(metrics.input));
				add("Output", formatTokens(metrics.output));
				add("Cache read", formatTokens(metrics.cacheRead));
			}
			if (metrics.costAvailable) add("Cost", `$${Math.max(0, metrics.cost).toFixed(2)}`);
			break;
		case "todos": {
			const glyphs = surfaceGlyphs("sidebar", true);
			for (const todo of snapshot.todos.slice(0, 3)) {
				const glyph =
					todo.status === "completed"
						? glyphs.todoCompleted
						: todo.status === "in_progress"
							? glyphs.todoInProgress
							: glyphs.todoPending;
				add(glyph, todo.text);
			}
			break;
		}
		case "workflows": {
			const usage = snapshot.subagentUsage;
			for (const run of usage?.runs ?? []) add(run.agent, "complete");
			if (usage?.pending) add("Run phase", `running (${usage.pending})`);
			break;
		}
		case "tools":
			if (snapshot.availableToolCount > 0)
				add("Active / available", `${snapshot.activeToolCount} / ${snapshot.availableToolCount}`);
			break;
		case "alerts":
			for (const status of snapshot.extensionStatuses) {
				const text = sanitizeInline(status);
				if (ALERT_STATUS.test(text)) rows.push(text);
			}
			break;
		case "activity":
			if (snapshot.runActivity.phase !== "idle") add("Run phase", snapshot.runActivity.phase);
			if (snapshot.runActivity.completedCount || snapshot.runActivity.failedCount) {
				add(
					"Tools",
					`${snapshot.runActivity.completedCount} done · ${snapshot.runActivity.failedCount} failed`,
				);
			}
			break;
		case "subagents":
			if (snapshot.subagentUsage) add("Runs", snapshot.subagentUsage.runs.length);
			break;
	}
	return rows.filter(Boolean);
}

export function sectionSummary(snapshot: SidebarSnapshot, id: string): string {
	let summary: string;
	switch (id) {
		case "agent":
			summary = [snapshot.modelId, snapshot.thinkingLevel].filter(Boolean).join(" · ");
			break;
		case "activity":
			summary = snapshot.runActivity.phase === "idle" ? "" : snapshot.runActivity.phase;
			break;
		case "alerts": {
			// Keep this severity match in sync with sidebar.ts statusAlerts().
			const count = snapshot.extensionStatuses.filter((status) =>
				ALERT_STATUS.test(sanitizeInline(status)),
			).length;
			summary = count ? `${count} alerts` : "";
			break;
		}
		case "todos": {
			if (snapshot.todos.length === 0) return "";
			const done = snapshot.todos.filter((todo) => todo.status === "completed").length;
			summary = `${done}/${snapshot.todos.length}`;
			break;
		}
		case "context": {
			const { contextPercent, contextTokens, contextWindow } = snapshot.metrics;
			if (contextPercent === null || contextTokens === null) return "";
			summary = `${contextPercent.toFixed(0)}% · ${formatTokens(contextTokens)}/${formatTokens(contextWindow)}`;
			break;
		}
		case "workspace": {
			const pulse = snapshot.workspacePulse;
			if (!("data" in pulse) || !snapshot.branch) return "";
			const { trackedFiles, untrackedFiles } = pulse.data.snapshot;
			summary = `${snapshot.branch} ±${trackedFiles + untrackedFiles}`;
			break;
		}
		case "usage": {
			const { input, output, cacheRead, usageAvailable } = snapshot.metrics;
			summary = usageAvailable
				? `${formatTokens(input)}/${formatTokens(output)}/${formatTokens(cacheRead)}`
				: "";
			break;
		}
		case "workflows":
		case "subagents": {
			const runs = snapshot.subagentUsage?.runs.length ?? 0;
			const agents = snapshot.subagentUsage?.pending ?? 0;
			summary = [runs && `${runs} runs`, agents && `${agents} agents`].filter(Boolean).join(" · ");
			break;
		}
		case "tools":
			summary = snapshot.availableToolCount
				? `${snapshot.activeToolCount}/${snapshot.availableToolCount}`
				: "";
			break;
		default:
			return "";
	}
	return sanitizeInline(summary);
}
