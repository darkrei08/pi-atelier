import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { createPalette, type PaletteRole, type ThemeLike } from "./palette.js";
import { asciiGlyphText, surfaceGlyphs } from "./glyphs.js";
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
// Activity and Context remain owned by the footer when the rail is on top.
const FOOTER_OWNED_SECTIONS = new Set<BuiltinSidebarPanelId>(["activity", "context"]);

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
	const glyphs = surfaceGlyphs("headerRail", config.nerdFont);
	const separator = `  ${glyphs.bullet}  `;
	const sections = config.sidebarPanelLayout.flatMap(({ id, visible }) => {
		if (
			!visible ||
			!isBuiltinSidebarPanelId(id) ||
			(config.panelPlacement === "top" && FOOTER_OWNED_SECTIONS.has(id))
		)
			return [];
		const role = SECTION_ROLES[id];
		if (!role) return [];
		const expanded = isSectionExpanded(expansion, id);
		const summary = expanded
			? config.nerdFont
				? sectionSummary(snapshot, id)
				: asciiGlyphText(sectionSummary(snapshot, id), "headerRail")
			: "";
		if (!summary && expanded) return [];
		const marker = expanded ? glyphs.railExpanded : glyphs.railCollapsed;
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
			const next = row ? `${row}${separator}${section}` : section;
			if (visibleWidth(next) <= safeWidth) {
				row = next;
				sectionIndex++;
			} else if (!row) {
				row = truncateToWidth(section, safeWidth, glyphs.ellipsis);
				sectionIndex++;
				break;
			} else break;
		}
		rows.push(row);
	}

	if (sectionIndex < sections.length) {
		const marker = `${glyphs.ellipsis} +${sections.length - sectionIndex}`;
		const suffix = `${separator}${marker}`;
		const finalRow = rows.length - 1;
		const available = Math.max(0, safeWidth - visibleWidth(suffix));
		rows[finalRow] = `${truncateToWidth(rows[finalRow] ?? "", available, glyphs.ellipsis)}${suffix}`;
		rows[finalRow] = truncateToWidth(rows[finalRow]!, safeWidth, glyphs.ellipsis);
	}
	return rows.filter(Boolean);
}
