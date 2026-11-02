
import {
  LifeBuoy,
  Users,
  ClipboardCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

const features = [
  {
    icon: LifeBuoy,
    title: "Request assistance",
    description:
      "Explain what you need and submit a help request through one simple form.",
  },
  {
    icon: Users,
    title: "Connect with helpers",
    description:
      "Help requests can be matched with volunteers who are ready to assist.",
  },
  {
    icon: ClipboardCheck,
    title: "Track your request",
    description:
      "Check your request status and follow progress as updates become available.",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Submit a request with the details of the assistance you need.",
  },
  {
    number: "02",
    title: "Connect with support",
    description:
      "Helpers can review suitable requests and respond to them.",
  },
  {
    number: "03",
    title: "Follow the progress",
    description:
      "Use your dashboard to view status changes and available updates.",
  },
];

function Home() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-label">
              <ShieldCheck size={17} />
              <span>DISASTER RESPONSE PLATFORM</span>
            </div>

            <h1>
              When disaster strikes,
              <span> help should be easier to find.</span>
            </h1>

            <p className="hero-description">
              DisasterConnect brings people who need assistance and
              volunteers who can help onto one simple platform.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="primary-button">
                Request Help
                <ArrowRight size={18} />
              </Link>

              <Link to="/createAcount" className="secondary-button">
                Become a Volunteer
              </Link>
            </div>

            <div className="hero-note">
              <CheckCircle2 size={17} />
              <span>One community. Connected support.</span>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-heading">
              <div className="panel-icon">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="panel-eyebrow">HOW IT WORKS</p>
                <h2>Support, step by step</h2>
              </div>
            </div>

            <div className="panel-step">
              <div className="step-icon">
                <LifeBuoy size={21} />
              </div>
              <div className="panel-step-text">
                <h3>Submit a help request</h3>
                <p>Describe the assistance you need.</p>
              </div>
              <span className="step-number">01</span>
            </div>

            <div className="panel-connector" />

            <div className="panel-step">
              <div className="step-icon">
                <Users size={21} />
              </div>
              <div className="panel-step-text">
                <h3>Connect with a helper</h3>
                <p>Available helpers can respond.</p>
              </div>
              <span className="step-number">02</span>
            </div>

            <div className="panel-connector" />

            <div className="panel-step">
              <div className="step-icon">
                <ClipboardCheck size={21} />
              </div>
              <div className="panel-step-text">
                <h3>Follow your progress</h3>
                <p>Check status updates in your dashboard.</p>
              </div>
              <span className="step-number">03</span>
            </div>

            <div className="panel-footer">
              <ShieldCheck size={17} />
              <span>Clear updates. Connected communities.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-heading">
            <span className="section-eyebrow">WHAT YOU CAN DO</span>
            <h2>Help and support, made simpler</h2>
            <p>
              Find the tools you need without unnecessary steps or
              confusing navigation.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={23} />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>

                  <span className="feature-detail">
                    Simple and clear
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-heading">
            <span className="section-eyebrow">OUR PURPOSE</span>
            <h2>Helping communities respond together.</h2>
          </div>

          <p>
            During a disaster, finding the right support can be difficult.
            DisasterConnect is designed to bring help requests, volunteers,
            and progress updates together in one organized place.
          </p>
        </div>
      </section>

      <section className="steps-section">
        <div className="section-container">
          <div className="section-heading">
            <span className="section-eyebrow">THREE SIMPLE STEPS</span>
            <h2>Getting started is easy</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="process-card" key={step.number}>
                <span className="process-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-container">
          <div>
            <h2>Every helping hand matters.</h2>
            <p>
              Start by requesting support or registering as a volunteer.
            </p>
          </div>

          <Link to="/createAcount" className="closing-button">
            Get Started
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    
    </main>
  );
}

export default Home;
