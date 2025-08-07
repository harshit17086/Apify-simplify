"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ResultsState = {
  data?: any[];
  status?: string | null;
  runId?: string | null;
  error?: string;
  note?: string;
  totalResults?: number;
} | null;

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<ResultsState>(null);
  const [activeTab, setActiveTab] = useState<
    "preview" | "source" | "formatted"
  >("preview");

  useEffect(() => {
    const resultsParam = searchParams.get("results");
    const statusParam = searchParams.get("status");
    const runIdParam = searchParams.get("runId");

    if (resultsParam) {
      try {
        const parsedResults = JSON.parse(decodeURIComponent(resultsParam));
        console.log("Parsed results:", parsedResults); // Debug log
        setResults({
          data: parsedResults,
          status: statusParam,
          runId: runIdParam,
        });
      } catch (e) {
        console.error("Error parsing results:", e);
        // Try to handle the case where it's already an array
        try {
          const directResults = JSON.parse(resultsParam);
          setResults({
            data: directResults,
            status: statusParam,
            runId: runIdParam,
          });
        } catch (e2) {
          console.error("Secondary parsing failed:", e2);
          setResults({ error: "Failed to parse results" });
        }
      }
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push("/dashboard");
  };

  const isHTML = (content: string): boolean => {
    return (
      typeof content === "string" &&
      content.trim().startsWith("<") &&
      content.includes("</")
    );
  };

  const renderHTMLContent = (content: string, fieldName: string) => {
    const isHTMLContent = isHTML(content);

    if (!isHTMLContent) {
      return <pre className="field-content">{content}</pre>;
    }

    return (
      <div className="html-content-container">
        <div className="html-tabs">
          <button
            className={`tab-button ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            📄 Preview
          </button>
          <button
            className={`tab-button ${activeTab === "source" ? "active" : ""}`}
            onClick={() => setActiveTab("source")}
          >
            📝 HTML Source
          </button>
          <button
            className={`tab-button ${
              activeTab === "formatted" ? "active" : ""
            }`}
            onClick={() => setActiveTab("formatted")}
          >
            🎨 Formatted
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "preview" && (
            <div className="html-preview">
              <iframe
                srcDoc={content}
                className="html-iframe"
                title={`HTML Preview - ${fieldName}`}
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {activeTab === "source" && (
            <details className="expandable-content">
              <summary>
                {content.substring(0, 200)}...
                <span className="expand-hint">
                  (Click to expand - {content.length} chars)
                </span>
              </summary>
              <pre className="full-content">{content}</pre>
            </details>
          )}

          {activeTab === "formatted" && (
            <div className="formatted-html">
              <pre className="formatted-content">{formatHTML(content)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatHTML = (html: string): string => {
    try {
      // Basic HTML formatting - add proper indentation
      let formatted = html.replace(/></g, ">\n<").replace(/\n\s*\n/g, "\n");

      let indent = 0;
      const lines = formatted.split("\n");
      const formattedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return "";

        if (trimmed.startsWith("</")) {
          indent = Math.max(0, indent - 2);
        }

        const result = " ".repeat(indent) + trimmed;

        if (
          trimmed.startsWith("<") &&
          !trimmed.startsWith("</") &&
          !trimmed.endsWith("/>")
        ) {
          indent += 2;
        }

        return result;
      });

      return formattedLines.join("\n");
    } catch (e) {
      return html;
    }
  };

  if (!results) {
    return (
      <div className="app-bg">
        <div className="card">
          <h1 className="title">Loading Results...</h1>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="app-bg">
        <div className="card">
          <h1 className="title">Error</h1>
          <div className="error">{results.error}</div>
          <button className="button" onClick={handleBack}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <div className="card wide">
        <div className="header">
          <h1 className="title">Actor Run Results</h1>
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
        </div>

        <div className="status-info">
          <span className={`status ${results.status?.toLowerCase()}`}>
            Status: {results.status}
          </span>
          {results.runId && (
            <span className="run-id">Run ID: {results.runId}</span>
          )}
        </div>

        <div className="results-section">
          <h2 className="subtitle">
            Results ({results.data?.length || 0} items)
          </h2>

          {results.note && <div className="info-note">ℹ️ {results.note}</div>}

          {results.data && results.data.length > 0 ? (
            <div className="results-container">
              {results.data.map((item, index) => (
                <div key={index} className="result-item">
                  <div className="item-header">
                    Item {item._itemIndex || index + 1}
                    {item._note && (
                      <span className="item-note"> - {item._note}</span>
                    )}
                  </div>
                  <div className="result-content">
                    {Object.entries(item).map(([key, value]) => {
                      // Skip internal fields
                      if (key.startsWith("_")) return null;

                      return (
                        <div key={key} className="field">
                          <div className="field-name">{key}:</div>
                          <div className="field-value">
                            {typeof value === "string" && isHTML(value) ? (
                              renderHTMLContent(value, key)
                            ) : typeof value === "string" &&
                              value.length > 1000 ? (
                              <details className="expandable-content">
                                <summary>
                                  {value.substring(0, 200)}...
                                  <span className="expand-hint">
                                    (Click to expand - {value.length} chars)
                                  </span>
                                </summary>
                                <pre className="full-content">{value}</pre>
                              </details>
                            ) : (
                              <pre className="field-content">
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No results found</div>
          )}
        </div>

        <style jsx>{`
          .app-bg {
            min-height: 100vh;
            background: #000;
            color: #fff;
            position: relative;
            padding: 2rem 1rem;
          }

          .app-bg::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at 70% 30%,
              rgba(34, 197, 94, 0.1) 0%,
              rgba(0, 0, 0, 0.8) 50%
            );
            z-index: 1;
          }

          .card {
            position: relative;
            z-index: 2;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            padding: 2rem;
            max-width: 800px;
            width: 100%;
            margin: 0 auto;
          }
          .wide {
            max-width: 1000px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }
          .title {
            font-size: 2rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(135deg, #fff, #a1a1aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .back-button {
            background: rgba(107, 114, 128, 0.2);
            color: #d1d5db;
            border: 1px solid rgba(107, 114, 128, 0.3);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
          }
          .back-button:hover {
            background: rgba(107, 114, 128, 0.3);
            transform: translateY(-1px);
          }
          .status-info {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          .status {
            padding: 0.75rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
            backdrop-filter: blur(20px);
          }
          .status.succeeded {
            background: rgba(34, 197, 94, 0.2);
            color: #86efac;
            border: 1px solid rgba(34, 197, 94, 0.3);
          }
          .status.failed,
          .status.aborted,
          .status.timed-out {
            background: rgba(239, 68, 68, 0.2);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .status.running {
            background: rgba(251, 191, 36, 0.2);
            color: #fcd34d;
            border: 1px solid rgba(251, 191, 36, 0.3);
          }
          .run-id {
            color: #a1a1aa;
            font-size: 0.9rem;
            padding: 0.75rem 1rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            font-family: monospace;
          }
          .subtitle {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #fff;
          }
          .info-note {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            color: #93c5fd;
            font-size: 0.9rem;
          }
          .results-container {
            max-height: 600px;
            overflow-y: auto;
          }
          .result-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            margin-bottom: 1.5rem;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          .result-item:hover {
            border-color: rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
          }
          .item-header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 1rem 1.5rem;
            font-weight: 700;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: #fff;
          }
          .item-note {
            font-weight: 400;
            color: #a1a1aa;
            font-size: 0.9rem;
          }
          .result-content {
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.01);
          }
          .field {
            margin-bottom: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 1rem;
          }
          .field:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .field-name {
            font-weight: 700;
            color: #d1d5db;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .field-value {
            margin-left: 1rem;
          }
          .field-content {
            margin: 0;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 0.85rem;
            line-height: 1.5;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 300px;
            overflow-y: auto;
            color: #e5e7eb;
            font-family: "Courier New", monospace;
          }
          .expandable-content {
            margin: 0;
          }
          .expandable-content summary {
            cursor: pointer;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 0.85rem;
            line-height: 1.4;
            font-family: "Courier New", monospace;
            color: #e5e7eb;
            transition: all 0.3s ease;
          }
          .expandable-content summary:hover {
            background: rgba(255, 255, 255, 0.05);
          }
          .expand-hint {
            color: #a1a1aa;
            font-style: italic;
            font-size: 0.8rem;
          }
          .full-content {
            margin: 0.5rem 0 0 0;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 0.85rem;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 400px;
            overflow-y: auto;
            color: #e5e7eb;
            font-family: "Courier New", monospace;
          }
          .no-results {
            text-align: center;
            color: #a1a1aa;
            padding: 3rem;
            font-size: 1.1rem;
          }
          .error {
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 2rem;
          }
          .button {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
          }
          .html-content-container {
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.02);
          }
          .html-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .tab-button {
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            font-weight: 500;
          }
          .tab-button:last-child {
            border-right: none;
          }
          .tab-button.active {
            background: rgba(59, 130, 246, 0.2);
            font-weight: 700;
            color: #93c5fd;
            border-color: rgba(59, 130, 246, 0.3);
          }
          .tab-button:hover:not(.active) {
            background: rgba(255, 255, 255, 0.05);
            color: #d1d5db;
          }
          .tab-content {
            background: rgba(255, 255, 255, 0.01);
          }
          .html-preview {
            position: relative;
            height: 400px;
          }
          .html-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #fff;
            border-radius: 0 0 12px 12px;
          }
          .formatted-html {
            max-height: 400px;
            overflow: auto;
          }
          .formatted-content {
            margin: 0;
            padding: 1rem;
            font-size: 0.8rem;
            line-height: 1.4;
            background: rgba(255, 255, 255, 0.02);
            color: #e5e7eb;
            white-space: pre;
            overflow-x: auto;
            font-family: "Courier New", monospace;
          }
        `}</style>
      </div>
    </div>
  );
}
