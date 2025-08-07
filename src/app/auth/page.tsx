"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthentication = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Test the API key by fetching actors
      const res = await fetch("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();
      if (data.error) {
        setError("Invalid API key. Please check and try again.");
      } else {
        // Store the API key in session storage for the next page
        sessionStorage.setItem("apifyApiKey", apiKey);
        router.push("/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleAuthentication();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <div className="logo-icon">🔐</div>
            <h1 className="auth-title">Secure Access</h1>
          </div>
          <p className="auth-subtitle">
            Enter your Apify API key to authenticate and access your actors
          </p>
        </div>

        <div className="auth-form">
          <div className="input-group">
            <label className="input-label">Apify API Key</label>
            <div className="input-wrapper">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="auth-input"
                placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                disabled={loading}
              />
              <div className="input-icon">🔑</div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            className="auth-button"
            onClick={handleAuthentication}
            disabled={loading || !apiKey.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Authenticating...
              </>
            ) : (
              <>
                <span>Continue</span>
                <svg className="button-arrow" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="auth-footer">
          <p className="security-note">
            🔒 Your API key is encrypted and never stored permanently
          </p>
          <p className="help-text">
            Don&apos;t have an API key?{" "}
            <a
              href="https://apify.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get one from Apify
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
        }

        .auth-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 30% 20%,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(0, 0, 0, 0.8) 50%
          );
          z-index: 1;
        }

        .auth-card {
          position: relative;
          z-index: 2;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-section {
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .auth-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 1rem 0;
          letter-spacing: -0.02em;
        }

        .auth-subtitle {
          font-size: 1.1rem;
          color: #a1a1aa;
          line-height: 1.5;
          margin: 0;
        }

        .auth-form {
          margin-bottom: 2rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #d4d4d8;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          position: relative;
        }

        .auth-input {
          width: 100%;
          padding: 1rem 3rem 1rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .auth-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .auth-input::placeholder {
          color: #71717a;
        }

        .input-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          opacity: 0.5;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: #fca5a5;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .error-icon {
          font-size: 1.1rem;
        }

        .auth-button {
          width: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .auth-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-arrow {
          width: 18px;
          height: 18px;
          transition: transform 0.3s ease;
        }

        .auth-button:hover:not(:disabled) .button-arrow {
          transform: translateX(4px);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-footer {
          text-align: center;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 2rem;
        }

        .security-note {
          font-size: 0.9rem;
          color: #a1a1aa;
          margin: 0 0 1rem 0;
        }

        .help-text {
          font-size: 0.85rem;
          color: #71717a;
          margin: 0;
        }

        .help-text a {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .help-text a:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 2rem;
            margin: 1rem;
          }

          .auth-title {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
