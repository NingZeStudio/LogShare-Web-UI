export function parseLog(raw: string, showLineNumbers: boolean = true): string {
    const lines = raw.split('\n');
    
    if (!showLineNumbers) {
        // 不显示行号，直接返回简单格式
        let html = '<div class="log-simple">';
        lines.forEach((line, index) => {
            if (lines.length === index + 1 && line === '') return;
            
            let level = 'info';
            if (line.match(/(\/|: |\[)WARN(ING)?(\]|:| )/i)) level = 'warning';
            else if (line.match(/(\/|: |\[)(ERR(OR)?|FATAL|SEVERE)(\]|:| )/i)) level = 'error';
            else if (line.match(/(\/|: |\[)(DEBUG)(\]|:| )/i)) level = 'debug';
            
            const entryClass = level === 'error' ? 'entry-error' : 'entry-no-error';
            const levelClass = `level-${level}`;
            let formatted = formatContent(line);
            
            html += `<div class="log-line-simple ${entryClass}"><span class="level ${levelClass}">${formatted}</span></div>`;
        });
        html += '</div>';
        return html;
    }
    
    // 显示行号模式 - 使用表格布局确保对齐
    let html = '<table class="log-table">';
    
    lines.forEach((line, index) => {
        if (lines.length === index + 1 && line === '') return;
        
        const lineNumber = index + 1;
        let level = 'info';
        
        if (line.match(/(\/|: |\[)WARN(ING)?(\]|:| )/i)) level = 'warning';
        else if (line.match(/(\/|: |\[)(ERR(OR)?|FATAL|SEVERE)(\]|:| )/i)) level = 'error';
        else if (line.match(/(\/|: |\[)(DEBUG)(\]|:| )/i)) level = 'debug';
        
        const entryClass = level === 'error' ? 'entry-error' : 'entry-no-error';
        const levelClass = `level-${level}`;
        let formatted = formatContent(line);
        
        html += `<tr class="log-row ${entryClass}" id="L${lineNumber}">
            <td class="line-num">${lineNumber}</td>
            <td class="line-content"><span class="level ${levelClass}">${formatted}</span></td>
        </tr>`;
    });
    
    html += '</table>';
    return html;
}

function formatContent(text: string): string {
    // 1. HTML Escape (但保留 mark 标签)
    let out = text.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
    
    // 2. 恢复 mark 标签 (用于搜索高亮)
    out = out.replace(/&lt;mark&gt;/gi, '<mark>')
             .replace(/&lt;\/mark&gt;/gi, '</mark>');

    // 2. Formatting Codes (§x)
    const styleMap: Record<string, string> = {
        '0': 'format-black', '1': 'format-darkblue', '2': 'format-darkgreen', '3': 'format-darkaqua',
        '4': 'format-darkred', '5': 'format-darkpurple', '6': 'format-gold', '7': 'format-gray',
        '8': 'format-darkgray', '9': 'format-blue', 'a': 'format-green', 'b': 'format-aqua',
        'c': 'format-red', 'd': 'format-lightpurple', 'e': 'format-yellow', 'f': 'format-white',
        'k': 'format-obfuscated', 'l': 'format-bold', 'm': 'format-strike', 'n': 'format-underline',
        'o': 'format-italic', 'r': 'format-reset'
    };

    out = out.replace(/§([0-9a-fk-or])/gi, (match, code) => {
        const cls = styleMap[code.toLowerCase()];
        if (cls) {
            return `<span class="${cls}">`;
        }
        return match;
    });

    return out;
}
