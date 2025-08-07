"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Actor = {
  id: string;
  name: string;
  title: string;
};

type InputSchema = {
  type: string;
  title: string;
  properties: Record<string, any>;
};

export default function Home() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [actors, setActors] = useState<Actor[]>([]);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [inputSchema, setInputSchema] = useState<InputSchema | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);

  const fetchActors = async () => {
    setLoading(true);
    setError("");
    setActors([]);
    setSelectedActor(null);
    setInputSchema(null);
    setInputValues({});
    try {
      const res = await fetch("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        // Handle the response structure for personal actors
        if (Array.isArray(data.actors)) {
          setActors(data.actors);
        } else if (data.actors?.items) {
          setActors(data.actors.items);
        } else {
          setActors([]);
        }
      }
    } catch (e) {
      setError("Network error");
    }
    setLoading(false);
  };

  const selectActor = async (actor: Actor) => {
    setSelectedActor(actor);
    setSchemaLoading(true);
    setError("");

    try {
      const res = await fetch("/api/actor-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, actorId: actor.id }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        console.log("Received schema:", data.schema);
        setInputSchema(data.schema);

        // Initialize input values with defaults
        const defaults: Record<string, any> = {};
        if (
          data.schema?.properties &&
          Object.keys(data.schema.properties).length > 0
        ) {
          // Schema has properties
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
          // No schema or empty schema - provide common defaults for web scraping
          defaults.url = "";
          defaults.startUrls = "";
        }
        console.log("Initial input values:", defaults);
        setInputValues(defaults);
      }
    } catch (e) {
      setError("Failed to fetch actor schema");
    }
    setSchemaLoading(false);
  };

  const handleInputChange = (key: string, value: any) => {
    console.log("Input changed:", key, "->", value);
    setInputValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const runActor = async () => {
    if (!selectedActor) return;

    // Prepare the input object
    let finalInput = { ...inputValues };

    // Handle special case for actors without schema
    if (
      !inputSchema?.properties ||
      Object.keys(inputSchema.properties).length === 0
    ) {
      // Clean up the input for actors without schema
      const cleanInput: Record<string, any> = {};

      // Add URL if provided
      if (inputValues.url) {
        cleanInput.url = inputValues.url;
      }

      // Add startUrls if provided and valid JSON
      if (inputValues.startUrls) {
        try {
          const parsedStartUrls = JSON.parse(inputValues.startUrls);
          cleanInput.startUrls = parsedStartUrls;
        } catch (e) {
          // If it's not valid JSON, treat it as a single URL
          if (inputValues.startUrls.startsWith("http")) {
            cleanInput.startUrls = [{ url: inputValues.startUrls }];
          }
        }
      }

      // Add additional input if provided and valid JSON
      if (inputValues.additionalInput) {
        try {
          const additionalData = JSON.parse(inputValues.additionalInput);
          Object.assign(cleanInput, additionalData);
        } catch (e) {
          console.warn("Invalid JSON in additional input, skipping");
        }
      }

      finalInput = cleanInput;
    }

    console.log("Running actor with input values:", finalInput);

    setRunLoading(true);
    setError("");

    try {
      const res = await fetch("/api/actor-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          actorId: selectedActor.id,
          input: finalInput,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        // Navigate to results page with the data
        const resultsParam = encodeURIComponent(JSON.stringify(data.results));
        router.push(
          `/result?results=${resultsParam}&status=${data.status}&runId=${data.runId}`
        );
      }
    } catch (e) {
      setError("Failed to run actor");
    }
    setRunLoading(false);
  };

  const goBack = () => {
    setSelectedActor(null);
    setInputSchema(null);
    setInputValues({});
    setError("");
  };

  const renderInputField = (key: string, property: any) => {
    const value = inputValues[key] || "";

    switch (property.type) {
      case "string":
        if (property.enum) {
          return (
            <select
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="input"
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
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="input"
            placeholder={
              property.description || `Enter ${property.title || key}`
            }
          />
        );
      case "boolean":
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleInputChange(key, e.target.checked)}
            />
            {property.title || key}
          </label>
        );
      case "number":
      case "integer":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) =>
              handleInputChange(
                key,
                property.type === "integer"
                  ? parseInt(e.target.value) || 0
                  : parseFloat(e.target.value) || 0
              )
            }
            className="input"
            step={property.type === "integer" ? "1" : "any"}
          />
        );
      default:
        return (
          <textarea
            value={typeof value === "string" ? value : JSON.stringify(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="input textarea"
            placeholder={
              property.description || `Enter ${property.title || key}`
            }
          />
        );
    }
  };

  return (
    <div className="app-bg">
      <div className="card">
        <h1 className="title">Apify Web Challenge</h1>

        {!selectedActor ? (
          <>
            <section className="section">
              <label className="label">
                Apify API Key
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input"
                  placeholder="Paste your Apify API key"
                />
              </label>
              <button
                className="button"
                onClick={fetchActors}
                disabled={!apiKey || loading}
              >
                {loading ? "Loading..." : "Fetch My Actors"}
              </button>
            </section>
            {error && <div className="error">{error}</div>}
            {actors.length > 0 && (
              <section className="section">
                <h2 className="subtitle">My Actors ({actors.length})</h2>
                <ul className="actor-list">
                  {actors.map((actor) => (
                    <li key={actor.id}>
                      <button
                        className="actor-item clickable"
                        onClick={() => selectActor(actor)}
                      >
                        <b>{actor.title || actor.name}</b>
                        <span className="actor-id">({actor.id})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="header">
              <button className="back-button" onClick={goBack}>
                ← Back to Actors
              </button>
            </div>
            <section className="section">
              <h2 className="subtitle">
                Configure: {selectedActor.title || selectedActor.name}
              </h2>
              {error && <div className="error">{error}</div>}

              {schemaLoading ? (
                <div className="loading">Loading input schema...</div>
              ) : inputSchema &&
                inputSchema.properties &&
                Object.keys(inputSchema.properties).length > 0 ? (
                <>
                  <div className="schema-form">
                    {Object.keys(inputSchema.properties).map((key) => {
                      const property = inputSchema.properties[key];
                      return (
                        <div key={key} className="field-group">
                          <label className="label">
                            {property.title || key}
                            {property.description && (
                              <span className="field-description">
                                {property.description}
                              </span>
                            )}
                            {renderInputField(key, property)}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="button run-button"
                    onClick={runActor}
                    disabled={runLoading}
                  >
                    {runLoading ? "Running Actor..." : "Run Actor"}
                  </button>
                </>
              ) : (
                <>
                  <div className="no-schema-info">
                    <p>
                      This actor doesn't have a defined input schema. Please
                      provide the input parameters manually:
                    </p>
                  </div>
                  <div className="manual-input-form">
                    <div className="field-group">
                      <label className="label">
                        Website URL
                        <span className="field-description">
                          Enter the URL of the website you want to scrape
                        </span>
                        <input
                          type="url"
                          value={inputValues.url || ""}
                          onChange={(e) =>
                            handleInputChange("url", e.target.value)
                          }
                          className="input"
                          placeholder="https://example.com"
                        />
                      </label>
                    </div>
                    <div className="field-group">
                      <label className="label">
                        Start URLs (Alternative)
                        <span className="field-description">
                          Or provide start URLs as JSON array (optional if URL
                          is provided above)
                        </span>
                        <textarea
                          value={inputValues.startUrls || ""}
                          onChange={(e) =>
                            handleInputChange("startUrls", e.target.value)
                          }
                          className="input textarea"
                          placeholder='[{"url": "https://example.com"}]'
                        />
                      </label>
                    </div>
                    <div className="field-group">
                      <label className="label">
                        Additional Input (JSON)
                        <span className="field-description">
                          Any additional parameters as JSON object (optional)
                        </span>
                        <textarea
                          value={inputValues.additionalInput || ""}
                          onChange={(e) =>
                            handleInputChange("additionalInput", e.target.value)
                          }
                          className="input textarea"
                          placeholder='{"maxPages": 10, "waitFor": 2000}'
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    className="button run-button"
                    onClick={runActor}
                    disabled={
                      runLoading || (!inputValues.url && !inputValues.startUrls)
                    }
                  >
                    {runLoading ? "Running Actor..." : "Run Actor"}
                  </button>
                </>
              )}
            </section>
          </>
        )}
      </div>
      <style jsx>{`
        .app-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }
        .card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08),
            0 1.5px 4px rgba(0, 0, 0, 0.04);
          padding: 2.5rem 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }
        .title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .section {
          margin-bottom: 2rem;
        }
        .header {
          margin-bottom: 1.5rem;
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
        .label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .field-description {
          display: block;
          font-weight: 400;
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .field-group {
          margin-bottom: 1.5rem;
        }
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          margin-top: 0.25rem;
          margin-bottom: 0.5rem;
          background: #f9fafb;
        }
        .textarea {
          min-height: 100px;
          resize: vertical;
          font-family: monospace;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
          cursor: pointer;
        }
        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        .button {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.6rem 1.2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s;
        }
        .button:disabled {
          background: #a5b4fc;
          cursor: not-allowed;
        }
        .button:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .run-button {
          background: #059669;
          width: 100%;
          padding: 0.8rem;
          margin-top: 1rem;
        }
        .run-button:hover:not(:disabled) {
          background: #047857;
        }
        .simple-run {
          background: #059669;
          margin-top: 1rem;
        }
        .error {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .loading {
          text-align: center;
          color: #6b7280;
          padding: 2rem;
          font-style: italic;
        }
        .no-schema-info {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          color: #1e40af;
        }
        .no-schema-info p {
          margin: 0;
          font-size: 0.9rem;
        }
        .manual-input-form {
          margin-bottom: 1rem;
        }
        .actor-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .actor-item {
          background: #f1f5f9;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 0.7rem 1rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          text-align: left;
          width: 100%;
        }
        .actor-item.clickable {
          cursor: pointer;
          transition: all 0.2s;
        }
        .actor-item.clickable:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .actor-id {
          color: #64748b;
          font-size: 0.95em;
        }
        .schema-form {
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
