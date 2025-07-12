import React from 'react';
import '../styles/about.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1>About Sports Safari</h1>
          <p>Revolutionizing how you book sports facilities</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <h2>Our Purpose</h2>
          <p>
            Sports Safari was created to simplify sports ground bookings. 
            We replace outdated paper systems and phone calls with an 
            intuitive digital platform that saves time and reduces conflicts.
          </p>
        </div>
        <div className="mission-image">
          <img src="/sportFacility.jpg" alt="Modern sports facility" />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Booking</h3>
            <p>Reserve facilities in seconds with our streamlined process</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Access</h3>
            <p>Manage bookings from anywhere using any device</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Real-Time Updates</h3>
            <p>See availability changes as they happen</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <h2>The Developer</h2>
          <div className="team-card">
            <img src="/manjeet.png" alt="Developer" />
            <h3>Manjeet Sharan</h3>
            <p>Full Stack Developer</p>
          </div>
      </section>
    </div>
  );
};

export default About;
