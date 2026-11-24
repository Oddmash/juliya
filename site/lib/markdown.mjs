export const escapeHtml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(character) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				character
			],
	);

const highlightCode = (value, language) => {
	if (!/^(?:js|jsx|ts|tsx|javascript|typescript|html|vue|svelte|bash|sh|css)$/.test(language)) return escapeHtml(value);
	const tokens = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|\b(import|export|from|const|let|function|return|async|await|new|if|else|true|false|null|undefined|type|interface)\b|\b(\d+(?:\.\d+)?)\b/g;
	let result = "";
	let cursor = 0;
	for (const match of value.matchAll(tokens)) {
		result += escapeHtml(value.slice(cursor, match.index));
		const kind = match[1] ? "string" : match[2] ? "comment" : match[3] ? "keyword" : "number";
		result += `<span class="syntax-${kind}">${escapeHtml(match[0])}</span>`;
		cursor = match.index + match[0].length;
	}
	return result + escapeHtml(value.slice(cursor));
};

const packageTabs = (content, id) => {
	const managers = ["npm", "pnpm", "yarn"];
	if (content.length !== managers.length || managers.some((manager, i) => !content[i].startsWith(manager + " "))) return null;
	const tabs = managers.map((manager, i) => `<button type="button" role="tab" id="${id}-${manager}-tab" aria-selected="${i === 0}" aria-controls="${id}-${manager}-panel" tabindex="${i === 0 ? 0 : -1}" data-package-tab data-package-code="${id}-${manager}">${manager === "yarn" ? "Yarn" : manager}</button>`).join("");
	const panels = managers.map((manager, i) => `<div role="tabpanel" id="${id}-${manager}-panel" aria-labelledby="${id}-${manager}-tab" tabindex="0"${i === 0 ? "" : " hidden"}><pre><code id="${id}-${manager}">${escapeHtml(content[i])}</code></pre></div>`).join("");
	return `<div class="doc-code package-manager-code" data-package-tabs><div class="doc-code-head"><div class="package-manager-tabs" role="tablist" aria-label="패키지 매니저">${tabs}</div><button type="button" class="om-button om-button--ghost om-button--sm" data-copy-target="${id}-npm">복사</button></div>${panels}</div>`;
};

const safeLink = (href, basePath) => {
	if (/^https?:\/\//i.test(href) || href.startsWith("#")) return href;
	const match = href.match(/^(?:\.\/)?([a-z0-9-]+)\.md(#[\p{L}\p{N}_-]+)?$/u);
	if (match)
		return `${basePath}/docs/${match[1] === "start" ? "" : `${match[1]}/`}${match[2] ?? ""}`;
	return "#";
};

const inline = (value, basePath) => {
	const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
	let output = "";
	let cursor = 0;
	for (const match of value.matchAll(pattern)) {
		output += escapeHtml(value.slice(cursor, match.index));
		if (match[1] !== undefined)
			output += `<code>${escapeHtml(match[1])}</code>`;
		else if (match[2] !== undefined)
			output += `<a href="${escapeHtml(safeLink(match[3], basePath))}">${escapeHtml(match[2])}</a>`;
		else output += `<strong>${escapeHtml(match[4])}</strong>`;
		cursor = match.index + match[0].length;
	}
	return output + escapeHtml(value.slice(cursor));
};

const heading = /^\s*(#{1,6})\s+(.+)$/;
const fence = /^\s*```([\w+-]*)\s*$/;
const list = /^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/;
const quote = /^\s*>\s?(.*)$/;
const tableRow = /^\s*\|.*\|\s*$/;
const tableDivider = /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/;
const cells = (line) =>
	line
		.trim()
		.slice(1, -1)
		.split("|")
		.map((cell) => cell.trim());
const slugOf = (value) =>
	value
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.trim()
		.replace(/\s+/g, "-") || "section";

export const renderMarkdown = (markdown, basePath = "") => {
	const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
	const headings = [];
	const used = new Map();
	const blocks = [];
	let title = "문서";
	let codeIndex = 0;
	let index = 0;
	const startOfBlock = (line) =>
		heading.test(line) ||
		fence.test(line) ||
		list.test(line) ||
		quote.test(line) ||
		tableRow.test(line);

	while (index < lines.length) {
		const line = lines[index];
		if (!line.trim()) {
			index++;
			continue;
		}
		const head = line.match(heading);
		if (head) {
			const level = head[1].length;
			const text = head[2];
			const base = slugOf(text);
			const count = (used.get(base) ?? 0) + 1;
			used.set(base, count);
			const id = count === 1 ? base : `${base}-${count}`;
			if (level === 1 && title === "문서") title = text;
			const tocEntry = level === 2 || level === 3;
			if (tocEntry) headings.push({ level, text, id });
			blocks.push(
				`<h${level} id="${escapeHtml(id)}"${tocEntry ? ' tabindex="-1"' : ""}>${inline(text, basePath)}</h${level}>`,
			);
			index++;
			continue;
		}
		const code = line.match(fence);
		if (code) {
			const content = [];
			index++;
			while (index < lines.length && !fence.test(lines[index]))
				content.push(lines[index++]);
			if (index < lines.length) index++;
			const id = `code-${++codeIndex}`;
			const packageGroup = code[1] === "package-managers" ? packageTabs(content, id) : null;
			if (packageGroup) {
				blocks.push(packageGroup);
				continue;
			}
			blocks.push(
				`<div class="doc-code"><div class="doc-code-head"><span>${escapeHtml(code[1] || "text")}</span><button type="button" class="om-button om-button--ghost om-button--sm" data-copy-target="${id}">복사</button></div><pre><code id="${id}">${highlightCode(content.join("\n"), code[1])}</code></pre></div>`,
			);
			continue;
		}
		if (tableRow.test(line) && tableDivider.test(lines[index + 1] ?? "")) {
			const header = cells(line)
				.map((cell) => `<th scope="col">${inline(cell, basePath)}</th>`)
				.join("");
			const rows = [];
			index += 2;
			while (index < lines.length && tableRow.test(lines[index]))
				rows.push(
					`<tr>${cells(lines[index++])
						.map((cell) => `<td>${inline(cell, basePath)}</td>`)
						.join("")}</tr>`,
				);
			blocks.push(
				`<div class="doc-table" tabindex="0" role="region" aria-label="표"><table><thead><tr>${header}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`,
			);
			continue;
		}
		const item = line.match(list);
		if (item) {
			const tag = item[2] ? "ol" : "ul";
			const items = [];
			while (index < lines.length) {
				const current = lines[index].match(list);
				if (!current || (current[2] ? "ol" : "ul") !== tag) break;
				items.push(`<li>${inline(current[3], basePath)}</li>`);
				index++;
			}
			blocks.push(`<${tag}>${items.join("")}</${tag}>`);
			continue;
		}
		if (quote.test(line)) {
			const content = [];
			while (index < lines.length && quote.test(lines[index]))
				content.push(lines[index++].match(quote)[1]);
			blocks.push(
				`<blockquote><p>${inline(content.join(" "), basePath)}</p></blockquote>`,
			);
			continue;
		}
		const paragraph = [line.trim()];
		index++;
		while (
			index < lines.length &&
			lines[index].trim() &&
			!startOfBlock(lines[index])
		)
			paragraph.push(lines[index++].trim());
		blocks.push(`<p>${inline(paragraph.join(" "), basePath)}</p>`);
	}
	return { title, headings, html: blocks.join("\n") };
};
