import { formatTokens } from "./metrics.js";
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
