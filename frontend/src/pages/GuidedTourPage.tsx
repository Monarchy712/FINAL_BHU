import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InputScreen from '../components/GuidedTour/InputScreen';
import LoadingScreen from '../components/GuidedTour/LoadingScreen';
import GlobeView from '../components/GuidedTour/GlobeView';

export default function GuidedTourPage() {
  const navigate = useNavigate();
  const [tourStage, setTourStage] = useState<'input' | 'loading' | 'globe'>('input');
  const [tourData, setTourData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTourSubmit = async ({ location, description }: { location: string, description: string }) => {
    setError('');
    setTourStage('loading');

    try {
      const res = await fetch("/generate-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);

      setTourData(data);
      setTourStage('globe');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setTourStage('input');
    }
  };

  const handleBack = () => {
    navigate('/enthusiasts');
  };

  if (tourStage === 'loading') {
    return <LoadingScreen />;
  }

  if (tourStage === 'globe' && tourData) {
    return <GlobeView tourData={tourData} onGoBack={() => setTourStage('input')} />;
  }

  return (
    <InputScreen 
      onSubmit={handleTourSubmit} 
      serverError={error} 
      onBack={handleBack}
    />
  );
}
