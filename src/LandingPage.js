import React, { useState } from 'react';
import './LandingPage.css';

const LandingPage = ({ onSourceSelect }) => {
  const [selectedSource, setSelectedSource] = useState('');

  const sources = [
    {
      id: 'gcp',
      name: 'Google Cloud Platform',
      logo: '☁️',
      description: 'Migrate from GCP Secret Manager'
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      logo: '☁️',
      description: 'Migrate from Azure Key Vault'
    },
    {
      id: 'hashicorp',
      name: 'HashiCorp Vault',
      logo: '🔐',
      description: 'Migrate from HashiCorp Vault'
    }
  ];

  const handleSubmit = () => {
    if (!selectedSource) {
      alert('Please select a source platform!');
      return;
    }
    
    if (selectedSource === 'hashicorp') {
      onSourceSelect('hashicorp');
    } else {
      alert(`Migration from ${sources.find(s => s.id === selectedSource)?.name} is coming soon!`);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <header className="landing-header">
          <h1>Secrets Migration Platform</h1>
          <p>Choose your source platform to begin migration to AWS Secrets Manager</p>
        </header>

        <main className="landing-main">
          <div className="source-selection">
            <h2>Select Source Platform</h2>
            <div className="sources-grid">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className={`source-card ${selectedSource === source.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSource(source.id)}
                >
                  <div className="source-logo">{source.logo}</div>
                  <div className="source-info">
                    <h3>{source.name}</h3>
                    <p>{source.description}</p>
                  </div>
                  <div className="source-selector">
                    <div className={`radio-circle ${selectedSource === source.id ? 'selected' : ''}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="destination-section">
            <h2>Destination Platform</h2>
            <div className="destination-card">
              <div className="destination-logo">🔒</div>
              <div className="destination-info">
                <h3>AWS Secrets Manager</h3>
                <p>Secure and scalable secrets management service</p>
              </div>
              <div className="destination-badge">Default</div>
            </div>
          </div>

          <div className="submit-section">
            <button 
              className="submit-button"
              onClick={handleSubmit}
              disabled={!selectedSource}
            >
              Continue to Migration Dashboard
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;
