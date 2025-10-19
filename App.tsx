
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LabReportIcon } from './components/icons';
import type { ExtractedLabData, ResearchData } from './types';
import { extractLabData, researchMedicalContext, synthesizePatientExplanation } from './services/geminiService';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [extractedData, setExtractedData] = useState<ExtractedLabData | null>(null);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [finalExplanation, setFinalExplanation] = useState<string | null>(null);

  const resetState = () => {
    setIsLoading(false);
    setCurrentStep('');
    setError(null);
    setExtractedData(null);
    setResearchData(null);
    setFinalExplanation(null);
  };

  const handleImageSelected = useCallback((file: File, base64: string) => {
    setImageFile(file);
    setImageBase64(base64);
    resetState();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !userQuery || !imageBase64) {
      setError('Please upload a lab report image and enter your question.');
      return;
    }

    resetState();
    setIsLoading(true);

    try {
      // Step 1: Extract Data
      setCurrentStep('Analyzing lab report...');
      const extracted = await extractLabData(imageBase64, imageFile.type, userQuery);
      setExtractedData(extracted);

      // Step 2: Research Context
      setCurrentStep('Researching medical context...');
      const research = await researchMedicalContext(extracted);
      setResearchData(research);

      // Step 3: Synthesize Explanation
      setCurrentStep('Generating patient-friendly explanation...');
      const explanation = await synthesizePatientExplanation(extracted, research.summary);
      setFinalExplanation(explanation);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <div className="flex justify-center items-center gap-4">
            <LabReportIcon className="w-12 h-12 text-cyan-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">MedReport Explainer</h1>
          </div>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your lab report, ask a question, and get a simple, AI-powered explanation.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800 border-b pb-3">1. Provide Your Report & Question</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <ImageUploader onImageSelected={handleImageSelected} />
                <div>
                  <label htmlFor="userQuery" className="block text-sm font-medium text-slate-700 mb-2">
                    What is your question about the report? (e.g., "What is my cholesterol level?")
                  </label>
                  <input
                    id="userQuery"
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  />
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading || !imageFile || !userQuery}
                  className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {currentStep}
                    </>
                  ) : (
                    'Generate Explanation'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800 border-b pb-3">2. AI-Generated Explanation</h2>
            <ResultsDisplay
              isLoading={isLoading}
              currentStep={currentStep}
              error={error}
              extractedData={extractedData}
              researchData={researchData}
              finalExplanation={finalExplanation}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
