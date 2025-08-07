"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Actor = {
  id: string;
  name: string;
  title: string;
  description?: string;
  createdAt?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedApiKey = sessionStorage.getItem("apifyApiKey");
    if (!storedApiKey) {
      router.push("/auth");
      return;
    }

    setApiKey(storedApiKey);
    fetchActors(storedApiKey);
  }, [router]);

  const fetchActors = async (key: string) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        const actorsList = Array.isArray(data.actors)
          ? data.actors
          : data.actors?.items || [];
        setActors(actorsList);
      }
    } catch {
      setError("Failed to fetch actors");
    }

    setLoading(false);
  };

  const selectActor = (actor: Actor) => {
    sessionStorage.setItem("selectedActor", JSON.stringify(actor));
    router.push("/configure");
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const filteredActors = actors.filter(
    (actor) =>
      actor.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      actor.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your actors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Your Actors</h1>
            <p className="dashboard-subtitle">
              Select an actor to configure and run
            </p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <span>Logout</span>
            <svg viewBox="0 0 24 24" fill="none" className="logout-icon">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none">
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search actors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Actors</h3>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => fetchActors(apiKey)}
            >
              Try Again
            </button>
          </div>
        ) : filteredActors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h3>No Actors Found</h3>
            <p>
              {searchTerm
                ? "No actors match your search. Try a different term."
                : "You don't have any actors yet. Create one in your Apify console."}
            </p>
          </div>
        ) : (
          <div className="actors-grid">
            {filteredActors.map((actor) => (
              <div
                key={actor.id}
                className="actor-card"
                onClick={() => selectActor(actor)}
              >
                <div className="actor-card-header">
                  <div className="actor-icon">🎯</div>
                  <div className="actor-status">Ready</div>
                </div>
                <div className="actor-card-content">
                  <h3 className="actor-name">{actor.title || actor.name}</h3>
                  <p className="actor-id">ID: {actor.id}</p>
                  {actor.description && (
                    <p className="actor-description">{actor.description}</p>
                  )}
                </div>
                <div className="actor-card-footer">
                  <div className="run-button">
                    <span>Configure & Run</span>
                    <svg viewBox="0 0 24 24" fill="none" className="run-arrow">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #000;
          color: #fff;
          position: relative;
        }

        .dashboard-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 20% 80%,
            rgba(120, 119, 198, 0.1) 0%,
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

        .dashboard-header {
          position: relative;
          z-index: 2;
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 3rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #fff, #a1a1aa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-subtitle {
          font-size: 1.2rem;
          color: #a1a1aa;
          margin: 0;
        }

        .logout-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .logout-button:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        .logout-icon {
          width: 18px;
          height: 18px;
        }

        .search-section {
          max-width: 400px;
        }

        .search-wrapper {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: #71717a;
          z-index: 1;
        }

        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .search-input::placeholder {
          color: #71717a;
        }

        .dashboard-content {
          position: relative;
          z-index: 2;
          padding: 0 2rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .error-state,
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .error-icon,
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .error-state h3,
        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #fff;
        }

        .error-state p,
        .empty-state p {
          font-size: 1rem;
          color: #a1a1aa;
          margin-bottom: 2rem;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .retry-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
        }

        .actors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .actor-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .actor-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .actor-card:hover {
          transform: translateY(-4px);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .actor-card:hover::before {
          opacity: 1;
        }

        .actor-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .actor-icon {
          font-size: 2rem;
        }

        .actor-status {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .actor-card-content {
          margin-bottom: 2rem;
        }

        .actor-name {
          font-size: 1.25rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .actor-id {
          font-size: 0.9rem;
          color: #71717a;
          margin: 0 0 1rem 0;
          font-family: monospace;
        }

        .actor-description {
          font-size: 0.9rem;
          color: #a1a1aa;
          line-height: 1.5;
          margin: 0;
        }

        .actor-card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .run-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #fff;
          transition: all 0.3s ease;
        }

        .run-arrow {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .actor-card:hover .run-arrow {
          transform: translateX(4px);
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
          .dashboard-header {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .actors-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .dashboard-content {
            padding: 0 1rem 2rem;
          }
        }
      `}</style>
    </div>
  );
}
