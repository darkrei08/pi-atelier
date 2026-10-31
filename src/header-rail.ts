import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { createPalette, type PaletteRole, type ThemeLike } from "./palette.js";
import { isSectionExpanded, type SectionExpansion, sectionSummary } from "./rail-sections.js";
import { isBuiltinSidebarPanelId } from "./sidebar-panels.js";
import { isColorEnabled } from "./text.js";
import type { AtelierConfig, BuiltinSidebarPanelId } from "./types.js";
import type { SidebarSnapshot } from "./sidebar.js";

const SECTION_ROLES: Partial<Record<BuiltinSidebarPanelId, PaletteRole>> = {
	agent: "primary",
	activity: "working",
	alerts: "warning",
	todos: "accent",
	context: "context",
	workspace: "accent",
	usage: "chartGold",
	subagents: "output",
	tools: "chartPink",
};
const SEPARATOR = "  ·  ";

export function renderHeaderRail(
	snapshot: SidebarSnapshot,
	config: AtelierConfig,
	theme: ThemeLike,
	width: number,
	expansion: SectionExpansion,
	focusedId?: string,
): string[] {
	const safeWidth = Math.max(0, Math.trunc(width));
	if (safeWidth === 0) return [];
	const palette = createPalette(theme, isColorEnabled());
	const sections = config.sidebarPanelLayout.flatMap(({ id, visible }) => {
		if (!visible || !isBuiltinSidebarPanelId(id)) return [];
		const role = SECTION_ROLES[id];
		if (!role) return [];
		const expanded = isSectionExpanded(expansion, id);
		const summary = expanded ? sectionSummary(snapshot, id) : "";
		if (!summary && expanded) return [];
		const marker = config.nerdFont ? (expanded ? "▾" : "▸") : expanded ? "[-]" : "[+]";
		const content = `${marker} ${id.toUpperCase()}${summary ? ` ${summary}` : ""}`;
		const text = focusedId === id ? theme.bold(`<${content}>`) : content;
		return [palette.paint(role, text)];
	});
	if (sections.length === 0) return [];

	const maxRows = Math.max(1, Math.min(4, Math.trunc(config.headerRailRows)));
	const rows: string[] = [];
	let sectionIndex = 0;
	while (sectionIndex < sections.length && rows.length < maxRows) {
		let row = "";
		while (sectionIndex < sections.length) {
			const section = sections[sectionIndex]!;
			const next = row ? `${row}${SEPARATOR}${section}` : section;
			if (visibleWidth(next) <= safeWidth) {
				row = next;
				sectionIndex++;
			} else if (!row) {
				row = truncateToWidth(section, safeWidth, "…");
				sectionIndex++;
				break;
			} else break;
		}
		rows.push(row);
	}

	if (sectionIndex < sections.length) {
		const marker = `… +${sections.length - sectionIndex}`;
		const suffix = `${SEPARATOR}${marker}`;
		const finalRow = rows.length - 1;
		const available = Math.max(0, safeWidth - visibleWidth(suffix));
		rows[finalRow] = `${truncateToWidth(rows[finalRow] ?? "", available, "…")}${suffix}`;
		rows[finalRow] = truncateToWidth(rows[finalRow]!, safeWidth, "…");
	}
	return rows.filter(Boolean);
}
