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
    router.push("/home");
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
            background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
            padding: 2rem 1rem;
          }
          .card {
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08),
              0 1.5px 4px rgba(0, 0, 0, 0.04);
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
            font-weight: 700;
            margin: 0;
          }
          .back-button {
            background: #6b7280;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .back-button:hover {
            background: #4b5563;
          }
          .status-info {
            display: flex;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          .status {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
          }
          .status.succeeded {
            background: #d1fae5;
            color: #065f46;
          }
          .status.failed,
          .status.aborted,
          .status.timed-out {
            background: #fee2e2;
            color: #991b1b;
          }
          .status.running {
            background: #fef3c7;
            color: #92400e;
          }
          .run-id {
            color: #6b7280;
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
            background: #f3f4f6;
            border-radius: 6px;
          }
          .subtitle {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
          }
          .info-note {
            background: #eff6ff;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
            color: #1e40af;
            font-size: 0.9rem;
          }
          .results-container {
            max-height: 600px;
            overflow-y: auto;
          }
          .result-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
          }
          .item-header {
            background: #f9fafb;
            padding: 0.75rem 1rem;
            font-weight: 600;
            border-bottom: 1px solid #e5e7eb;
          }
          .item-note {
            font-weight: 400;
            color: #6b7280;
            font-size: 0.9rem;
          }
          .result-content {
            padding: 1rem;
            background: #fff;
          }
          .field {
            margin-bottom: 1rem;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 0.75rem;
          }
          .field:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .field-name {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
          }
          .field-value {
            margin-left: 1rem;
          }
          .field-content {
            margin: 0;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 4px;
            font-size: 0.85rem;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 300px;
            overflow-y: auto;
          }
          .expandable-content {
            margin: 0;
          }
          .expandable-content summary {
            cursor: pointer;
            padding: 0.5rem;
            background: #f3f4f6;
            border-radius: 4px;
            font-size: 0.85rem;
            line-height: 1.4;
            font-family: monospace;
          }
          .expand-hint {
            color: #6b7280;
            font-style: italic;
            font-size: 0.8rem;
          }
          .full-content {
            margin: 0.5rem 0 0 0;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 4px;
            font-size: 0.85rem;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 400px;
            overflow-y: auto;
          }
          .no-results {
            text-align: center;
            color: #6b7280;
            padding: 3rem;
            font-size: 1.1rem;
          }
          .error {
            color: #dc2626;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 1rem;
            margin-bottom: 2rem;
          }
          .button {
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            cursor: pointer;
          }
          .html-content-container {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .html-tabs {
            display: flex;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
          }
          .tab-button {
            flex: 1;
            padding: 0.75rem 1rem;
            border: none;
            background: transparent;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
            border-right: 1px solid #e5e7eb;
          }
          .tab-button:last-child {
            border-right: none;
          }
          .tab-button.active {
            background: #fff;
            font-weight: 600;
            color: #2563eb;
          }
          .tab-button:hover:not(.active) {
            background: #f3f4f6;
          }
          .tab-content {
            background: #fff;
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
            background: #f8f9fa;
            color: #374151;
            white-space: pre;
            overflow-x: auto;
          }
        `}</style>
      </div>
    </div>
  );
}
