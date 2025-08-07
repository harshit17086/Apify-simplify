"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Actor = {
  id: string;
  name: string;
  title: string;
};

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  format?: string;
}

interface InputSchema {
  type: string;
  title: string;
  properties: Record<string, SchemaProperty>;
}

export default function ConfigurePage() {
  const router = useRouter();
  const [actor, setActor] = useState<Actor | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [inputSchema, setInputSchema] = useState<InputSchema | null>(null);
  const [inputValues, setInputValues] = useState<
    Record<string, string | number | boolean | object | undefined>
  >({});
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedApiKey = sessionStorage.getItem("apifyApiKey");
    const storedActor = sessionStorage.getItem("selectedActor");

    if (!storedApiKey || !storedActor) {
      router.push("/auth");
      return;
    }

    const parsedActor = JSON.parse(storedActor);
    setApiKey(storedApiKey);
    setActor(parsedActor);
    fetchActorSchema(storedApiKey, parsedActor.id);
  }, [router]);

  const fetchActorSchema = async (key: string, actorId: string) => {
    try {
      const res = await fetch("/api/actor-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, actorId }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setInputSchema(data.schema);

        // Initialize input values
        const defaults: Record<
          string,
          string | number | boolean | object | undefined
        > = {};
        if (
          data.schema?.properties &&
          Object.keys(data.schema.properties).length > 0
        ) {
          Object.keys(data.schema.properties).forEach((key) => {
            const prop = data.schema.properties[key];
            if (prop.default !== undefined) {
              defaults[key] = prop.default;
            } else if (prop.type === "string") {
              defaults[key] = "";
            } else if (prop.type === "boolean") {
              defaults[key] = false;
            } else if (prop.type === "number" || prop.type === "integer") {
              defaults[key] = 0;
            }
          });
        } else {
          // No schema - provide common defaults
          defaults.url = "";
          defaults.startUrls = "";
        }
        setInputValues(defaults);
      }
    } catch {
      setError("Failed to fetch actor schema");
    }
    setLoading(false);
  };

  const handleInputChange = (
    key: string,
    value: string | number | boolean | object | undefined
  ) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
  };

  const runActor = async () => {
    if (!actor) return;

    setRunLoading(true);
    setError("");

    try {
      let finalInput: Record<
        string,
        string | number | boolean | object | undefined
      > = { ...inputValues };

      // Handle special case for actors without schema
      if (
        !inputSchema?.properties ||
        Object.keys(inputSchema.properties).length === 0
      ) {
        const cleanInput: Record<
          string,
          string | number | boolean | object | undefined
        > = {};

        if (inputValues.url && typeof inputValues.url === "string") {
          cleanInput.url = inputValues.url;
        }

        if (
          inputValues.startUrls &&
          typeof inputValues.startUrls === "string"
        ) {
          try {
            const parsedStartUrls = JSON.parse(inputValues.startUrls);
            cleanInput.startUrls = parsedStartUrls;
          } catch {
            if (inputValues.startUrls.startsWith("http")) {
              cleanInput.startUrls = [{ url: inputValues.startUrls }];
            }
          }
        }

        if (
          inputValues.additionalInput &&
          typeof inputValues.additionalInput === "string"
        ) {
          try {
            const additionalData = JSON.parse(inputValues.additionalInput);
            Object.assign(cleanInput, additionalData);
          } catch {
            console.warn("Invalid JSON in additional input, skipping");
          }
        }

        finalInput = cleanInput;
      }

      const res = await fetch("/api/actor-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          actorId: actor.id,
          input: finalInput,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const resultsParam = encodeURIComponent(JSON.stringify(data.results));
        router.push(
          `/result?results=${resultsParam}&status=${data.status}&runId=${data.runId}`
        );
      }
    } catch {
      setError("Failed to run actor");
    }
    setRunLoading(false);
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  const renderInputField = (key: string, property: SchemaProperty) => {
    const value = inputValues[key];

    switch (property.type) {
      case "string":
        if (property.enum) {
          return (
            <select
              value={typeof value === "string" ? value : ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="config-input config-select"
            >
              <option value="">Select...</option>
              {property.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        }
        return (
          <input
            type={property.format === "uri" ? "url" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="config-input"
            placeholder={
              property.description || `Enter ${property.title || key}`
            }
          />
        );
      case "boolean":
        return (
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={typeof value === "boolean" ? value : false}
              onChange={(e) => handleInputChange(key, e.target.checked)}
              className="config-checkbox"
            />
            <span className="checkbox-label">{property.title || key}</span>
          </label>
        );
      case "number":
      case "integer":
        return (
          <input
            type="number"
            value={typeof value === "number" ? value : ""}
            onChange={(e) =>
              handleInputChange(
                key,
                property.type === "integer"
                  ? parseInt(e.target.value) || 0
                  : parseFloat(e.target.value) || 0
              )
            }
            className="config-input"
            step={property.type === "integer" ? "1" : "any"}
          />
        );
      default:
        return (
          <textarea
            value={typeof value === "string" ? value : JSON.stringify(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="config-input config-textarea"
            placeholder={
              property.description || `Enter ${property.title || key}`
            }
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="configure-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configure-container">
      <div className="configure-header">
        <button className="back-button" onClick={goBack}>
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

        <div className="actor-info">
          <div className="actor-badge">🎯</div>
          <div>
            <h1 className="configure-title">{actor?.title || actor?.name}</h1>
            <p className="configure-subtitle">
              Configure parameters and run your actor
            </p>
          </div>
        </div>
      </div>

      <div className="configure-content">
        <div className="config-card">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {inputSchema &&
          inputSchema.properties &&
          Object.keys(inputSchema.properties).length > 0 ? (
            <div className="schema-form">
              <h3 className="form-section-title">Actor Parameters</h3>
              {Object.keys(inputSchema.properties).map((key) => {
                const property = inputSchema.properties[key];
                return (
                  <div key={key} className="input-group">
                    <label className="input-label">
                      {property.title || key}
                      {property.description && (
                        <span className="input-description">
                          {property.description}
                        </span>
                      )}
                    </label>
                    {renderInputField(key, property)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="manual-form">
              <h3 className="form-section-title">Manual Configuration</h3>
              <p className="form-section-description">
                This actor doesn&apos;t have a defined schema. Please provide
                the input parameters manually.
              </p>

              <div className="input-group">
                <label className="input-label">
                  Website URL
                  <span className="input-description">
                    Enter the URL you want to scrape
                  </span>
                </label>
                <input
                  type="url"
                  value={
                    typeof inputValues.url === "string" ? inputValues.url : ""
                  }
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  className="config-input"
                  placeholder="https://example.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Start URLs (Alternative)
                  <span className="input-description">
                    Provide start URLs as JSON array (optional)
                  </span>
                </label>
                <textarea
                  value={
                    typeof inputValues.startUrls === "string"
                      ? inputValues.startUrls
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange("startUrls", e.target.value)
                  }
                  className="config-input config-textarea"
                  placeholder='[{"url": "https://example.com"}]'
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Additional Parameters
                  <span className="input-description">
                    Any additional parameters as JSON object (optional)
                  </span>
                </label>
                <textarea
                  value={
                    typeof inputValues.additionalInput === "string"
                      ? inputValues.additionalInput
                      : ""
                  }
                  onChange={(e) =>
                    handleInputChange("additionalInput", e.target.value)
                  }
                  className="config-input config-textarea"
                  placeholder='{"maxPages": 10, "waitFor": 2000}'
                />
              </div>
            </div>
          )}

          <div className="run-section">
            <button
              className="run-button"
              onClick={runActor}
              disabled={
                runLoading ||
                (!inputValues.url &&
                  !inputValues.startUrls &&
                  (!inputSchema?.properties ||
                    Object.keys(inputSchema.properties).length === 0))
              }
            >
              {runLoading ? (
                <>
                  <div className="run-spinner"></div>
                  Running Actor...
                </>
              ) : (
                <>
                  <span>🚀 Run Actor</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .configure-container {
          min-height: 100vh;
          background: #000;
          color: #fff;
          position: relative;
        }

        .configure-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 80% 20%,
            rgba(139, 92, 246, 0.1) 0%,
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

        .loading-spinner,
        .run-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .configure-header {
          position: relative;
          z-index: 2;
          padding: 2rem;
          max-width: 800px;
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

        .actor-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .actor-badge {
          font-size: 3rem;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          padding: 1rem;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .configure-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          color: #fff;
        }

        .configure-subtitle {
          font-size: 1rem;
          color: #a1a1aa;
          margin: 0;
        }

        .configure-content {
          position: relative;
          z-index: 2;
          padding: 0 2rem 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .config-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2rem;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 1rem;
          color: #fca5a5;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .form-section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .form-section-description {
          font-size: 0.9rem;
          color: #a1a1aa;
          margin: 0 0 2rem 0;
          line-height: 1.5;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #d4d4d8;
          margin-bottom: 0.5rem;
        }

        .input-description {
          display: block;
          font-weight: 400;
          font-size: 0.8rem;
          color: #71717a;
          margin-top: 0.25rem;
        }

        .config-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .config-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .config-input::placeholder {
          color: #71717a;
        }

        .config-textarea {
          min-height: 100px;
          resize: vertical;
          font-family: monospace;
        }

        .config-select {
          cursor: pointer;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .config-checkbox {
          width: 18px;
          height: 18px;
          accent-color: #3b82f6;
        }

        .checkbox-label {
          font-weight: 500;
          color: #d4d4d8;
        }

        .run-section {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .run-button {
          width: 100%;
          background: linear-gradient(135deg, #059669, #047857);
          border: none;
          border-radius: 16px;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 10px 30px rgba(5, 150, 105, 0.3);
        }

        .run-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(5, 150, 105, 0.4);
        }

        .run-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
          .configure-header,
          .configure-content {
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .actor-info {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .configure-title {
            font-size: 1.5rem;
          }

          .config-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
