import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import Layout from './components/Layout/Layout';
import InputForm from './components/InputForm/InputForm';
import ResultsChart from './components/ResultsChart/ResultsChart';
import { calculateTransport } from './api/soluteTransport';
import { SoluteTransportInput, SoluteTransportResult } from './types';
import './App.css';

export default function App() {
  const [results, setResults] = useState<SoluteTransportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: SubmitHandler<SoluteTransportInput> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateTransport(data);
      setResults(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please check the API connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="app-grid">
        <aside className="app-sidebar">
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
        </aside>
        <section className="app-content">
          {error && (
            <div className="error-banner" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
          {isLoading ? (
            <div className="loading-banner">Calculating solute transport…</div>
          ) : (
            <ResultsChart results={results} />
          )}
        </section>
      </div>
    </Layout>
  );
}
