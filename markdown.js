(function () {
  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function inline(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function slugify(value, index) {
    const slug = value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    return slug || `section-${index}`;
  }

  function render(markdown = "") {
    const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
    const output = [];
    let paragraph = [];
    let listType = "";
    let inCode = false;
    let code = [];
    let headingIndex = 0;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const closeList = () => {
      if (!listType) return;
      output.push(`</${listType}>`);
      listType = "";
    };

    lines.forEach((line) => {
      if (line.startsWith("```")) {
        flushParagraph();
        closeList();
        if (inCode) {
          output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
          code = [];
        }
        inCode = !inCode;
        return;
      }
      if (inCode) {
        code.push(line);
        return;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const unordered = line.match(/^[-*]\s+(.+)$/);
      const ordered = line.match(/^\d+\.\s+(.+)$/);
      if (heading) {
        flushParagraph();
        closeList();
        const level = heading[1].length;
        const text = heading[2].trim();
        headingIndex += 1;
        output.push(`<h${level} id="${slugify(text, headingIndex)}">${inline(text)}</h${level}>`);
      } else if (unordered || ordered) {
        flushParagraph();
        const nextType = unordered ? "ul" : "ol";
        if (listType !== nextType) {
          closeList();
          listType = nextType;
          output.push(`<${listType}>`);
        }
        output.push(`<li>${inline((unordered || ordered)[1])}</li>`);
      } else if (/^>\s?/.test(line)) {
        flushParagraph();
        closeList();
        output.push(`<blockquote>${inline(line.replace(/^>\s?/, ""))}</blockquote>`);
      } else if (/^---+$/.test(line.trim())) {
        flushParagraph();
        closeList();
        output.push("<hr>");
      } else if (!line.trim()) {
        flushParagraph();
        closeList();
      } else {
        paragraph.push(line.trim());
      }
    });
    flushParagraph();
    closeList();
    if (inCode && code.length) output.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    return output.join("");
  }

  window.blogMarkdown = { render };
})();
