"use client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/auth");
  };

  return (
    <div className="landing-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Your Apify Actors
            <br />
            <span className="gradient-text">At Your Doorstep</span>
          </h1>
          <p className="hero-description">
            Experience the future of web automation. Deploy, configure, and
            execute your Apify actors with an interface that feels like magic.
          </p>
          <button className="cta-button" onClick={handleContinue}>
            <span>Click to Continue</span>
            <svg className="arrow-icon" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="hero-visual">
          <div className="floating-cards">
            <div className="card card-1">
              <div className="card-icon">🤖</div>
              <div className="card-text">AI Agents</div>
            </div>
            <div className="card card-2">
              <div className="card-icon">⚡</div>
              <div className="card-text">Lightning Fast</div>
            </div>
            <div className="card card-3">
              <div className="card-icon">🌐</div>
              <div className="card-text">Web Automation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-preview">
        <div className="feature-pill">
          <span>🔐</span> Secure Authentication
        </div>
        <div className="feature-pill">
          <span>⚙️</span> Smart Configuration
        </div>
        <div className="feature-pill">
          <span>📊</span> Real-time Results
        </div>
      </div>

      <style jsx>{`
        .landing-container {
          min-height: 100vh;
          background: #000;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .landing-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(59, 130, 246, 0.15) 0%,
            rgba(0, 0, 0, 0.8) 70%
          );
          z-index: 1;
        }

        .hero-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 80vh;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 2;
        }

        .hero-content {
          flex: 1;
          max-width: 600px;
          padding-right: 2rem;
        }

        .hero-title {
          font-size: clamp(3rem, 6vw, 5rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 2rem;
          letter-spacing: -0.02em;
        }

        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description {
          font-size: 1.25rem;
          line-height: 1.6;
          color: #a1a1aa;
          margin-bottom: 3rem;
          max-width: 500px;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          border-radius: 50px;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }

        .arrow-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.3s ease;
        }

        .cta-button:hover .arrow-icon {
          transform: translateX(4px);
        }

        .hero-visual {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .floating-cards {
          position: relative;
          width: 300px;
          height: 300px;
        }

        .card {
          position: absolute;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          animation: float 6s ease-in-out infinite;
        }

        .card-1 {
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          animation-delay: 0s;
        }

        .card-2 {
          bottom: 0;
          left: 0;
          animation-delay: 2s;
        }

        .card-3 {
          bottom: 0;
          right: 0;
          animation-delay: 4s;
        }

        .card-icon {
          font-size: 2rem;
        }

        .card-text {
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .features-preview {
          display: flex;
          justify-content: center;
          gap: 2rem;
          padding: 2rem;
          position: relative;
          z-index: 2;
          flex-wrap: wrap;
        }

        .feature-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #d4d4d8;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
          }

          .hero-content {
            padding-right: 0;
            margin-bottom: 3rem;
          }

          .features-preview {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
