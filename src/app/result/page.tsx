"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface ResultItem {
  [key: string]: string | number | boolean | object | null | undefined;
  _itemIndex?: number;
  _note?: string;
}

type ResultsState = {
  data?: ResultItem[];
  status?: string | null;
  runId?: string | null;
  error?: string;
  note?: string;
  totalResults?: number;
} | null;

function ResultPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [results, setResults] = useState<ResultsState>(null);

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

  if (!results) {
    return (
      <div className="result-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Results...</p>
        </div>
      </div>
    );
  }

  if (results.error) {
    return (
      <div className="result-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>{results.error}</p>
          <button className="back-button" onClick={handleBack}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <button className="back-button" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" className="back-icon">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Dashboard
        </button>

        <div className="result-info">
          <div className="result-badge">📊</div>
          <div>
            <h1 className="result-title">Actor Run Results</h1>
            <p className="result-subtitle">
              View and analyze your actor execution results
            </p>
          </div>
        </div>
      </div>

      <div className="result-content">
        <div className="status-info">
          <span className={`status ${results.status?.toLowerCase()}`}>
            Status: {results.status}
          </span>
          {results.runId && (
            <span className="run-id">Run ID: {results.runId}</span>
          )}
        </div>

        <div className="results-section">
          <h2 className="section-title">
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
                            {typeof value === "string" &&
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
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Results Found</h3>
              <p>No data was returned from the actor execution.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .result-container {
          min-height: 100vh;
          background: #000;
          color: #fff;
          position: relative;
        }

        .result-container::before {
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

        .loading-state {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-state {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 4rem 2rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #fff;
        }

        .error-state p {
          font-size: 1rem;
          color: #a1a1aa;
          margin-bottom: 2rem;
        }

        .result-header {
          position: relative;
          z-index: 2;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          margin-bottom: 2rem;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: translateY(-1px);
        }

        .back-icon {
          width: 18px;
          height: 18px;
        }

        .result-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .result-badge {
          font-size: 3rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 16px;
          padding: 1rem;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .result-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .result-subtitle {
          font-size: 1rem;
          color: #a1a1aa;
          margin: 0;
        }

        .result-content {
          position: relative;
          z-index: 2;
          padding: 0 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
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

        .results-section {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
        }

        .section-title {
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

        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #fff;
        }

        .empty-state p {
          font-size: 1rem;
          color: #a1a1aa;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .result-header,
          .result-content {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .result-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .result-title {
            font-size: 1.5rem;
          }

          .status-info {
            flex-direction: column;
          }

          .results-section {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="result-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading Results...</p>
          </div>
        </div>
      }
    >
      <ResultPageContent />
    </Suspense>
  );
}
