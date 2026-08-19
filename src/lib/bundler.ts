import { ProjectFile } from "../types";

export function buildSandboxHtml(files: ProjectFile[]): string {
  // Find index.html or primary html file
  const htmlFile =
    files.find(
      (f) => !f.isFolder && (f.path.toLowerCase() === "index.html" || f.name.toLowerCase().endsWith(".html"))
    ) || files.find((f) => !f.isFolder && f.name.toLowerCase().endsWith(".html"));

  const cssFiles = files.filter(
    (f) => !f.isFolder && (f.name.toLowerCase().endsWith(".css") || f.language === "css")
  );

  const jsFiles = files.filter(
    (f) =>
      !f.isFolder &&
      (f.name.toLowerCase().endsWith(".js") ||
        f.name.toLowerCase().endsWith(".ts") ||
        f.name.toLowerCase().endsWith(".jsx") ||
        f.name.toLowerCase().endsWith(".tsx") ||
        f.language === "javascript" ||
        f.language === "typescript" ||
        f.language === "jsx" ||
        f.language === "tsx")
  );

  let rawHtml = htmlFile?.content || `<!DOCTYPE html><html><head><title>Nexora Preview</title></head><body><div style="font-family:sans-serif;padding:24px;text-align:center;color:#64748b;">No HTML entry file found. Create an index.html file to preview.</div></body></html>`;

  // Inject console interceptor script into <head>
  const consoleInterceptorScript = `
<script>
(function() {
  function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return Object.prototype.toString.call(arg);
      }
    }
    return String(arg);
  }

  function emitLog(type, args, meta) {
    try {
      const message = Array.from(args).map(formatArg).join(' ');
      window.parent.postMessage({
        source: 'nexora_sandbox',
        type: 'console',
        payload: {
          id: 'log_' + Math.random().toString(36).slice(2, 9),
          type: type,
          message: message,
          timestamp: new Date().toISOString(),
          line: meta ? meta.line : undefined,
          col: meta ? meta.col : undefined,
          file: meta ? meta.file : undefined,
          stack: meta ? meta.stack : undefined
        }
      }, '*');
    } catch(e) {}
  }

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = function() { originalLog.apply(console, arguments); emitLog('log', arguments); };
  console.info = function() { originalInfo.apply(console, arguments); emitLog('info', arguments); };
  console.warn = function() { originalWarn.apply(console, arguments); emitLog('warn', arguments); };
  console.error = function() { originalError.apply(console, arguments); emitLog('error', arguments); };

  window.onerror = function(message, source, lineno, colno, error) {
    emitLog('error', [message], {
      line: lineno,
      col: colno,
      file: source ? source.split('/').pop() : 'inline',
      stack: error ? error.stack : undefined
    });
    return false;
  };

  window.addEventListener('unhandledrejection', function(event) {
    emitLog('error', ['Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : 'Unknown rejection')], {
      stack: event.reason && event.reason.stack ? event.reason.stack : undefined
    });
  });
})();
</script>
`;

  // Inject styles from other CSS files if not already explicitly referenced
  const combinedStyles = cssFiles
    .map((f) => `/* ${f.name} */\n${f.content}`)
    .join("\n\n");

  const styleTag = combinedStyles
    ? `\n<style id="nexora-injected-styles">\n${combinedStyles}\n</style>\n`
    : "";

  // Prepare script tags for JS files not referenced in HTML
  // If HTML contains React/Babel or standard scripts, handle them cleanly
  let modifiedHtml = rawHtml;

  // Insert console interceptor right after <head> or at top
  if (modifiedHtml.includes("<head>")) {
    modifiedHtml = modifiedHtml.replace("<head>", `<head>\n${consoleInterceptorScript}\n${styleTag}`);
  } else if (modifiedHtml.includes("<html>")) {
    modifiedHtml = modifiedHtml.replace("<html>", `<html><head>\n${consoleInterceptorScript}\n${styleTag}</head>`);
  } else {
    modifiedHtml = `<head>\n${consoleInterceptorScript}\n${styleTag}</head>\n${modifiedHtml}`;
  }

  // Handle external or bundled scripts:
  // If the HTML does not reference local js files, inject them at bottom of body
  const scriptsToInject: string[] = [];
  for (const jsFile of jsFiles) {
    const isAlreadyReferenced =
      rawHtml.includes(`src="${jsFile.name}"`) ||
      rawHtml.includes(`src="./${jsFile.name}"`) ||
      rawHtml.includes(`src="${jsFile.path}"`);

    if (!isAlreadyReferenced) {
      if (jsFile.language === "jsx" || jsFile.name.endsWith(".jsx")) {
        scriptsToInject.push(`\n<script type="text/babel">\n// ${jsFile.name}\n${jsFile.content}\n</script>\n`);
      } else {
        scriptsToInject.push(`\n<script>\n// ${jsFile.name}\n${jsFile.content}\n</script>\n`);
      }
    }
  }

  if (scriptsToInject.length > 0) {
    if (modifiedHtml.includes("</body>")) {
      modifiedHtml = modifiedHtml.replace("</body>", `${scriptsToInject.join("\n")}\n</body>`);
    } else {
      modifiedHtml += `\n${scriptsToInject.join("\n")}`;
    }
  }

  return modifiedHtml;
}
