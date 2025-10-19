
import React from 'react';
import type { ExtractedLabData, ResearchData } from '../types';
import { AnalystIcon, ResearcherIcon, ExplainerIcon, SourceIcon } from './icons';

interface ResultsDisplayProps {
  isLoading: boolean;
  currentStep: string;
  error: string | null;
  extractedData: ExtractedLabData | null;
  researchData: ResearchData | null;
  finalExplanation: string | null;
}

const LoadingState: React.FC<{ currentStep: string }> = ({ currentStep }) => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <svg className="animate-spin h-12 w-12 text-cyan-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg font-semibold text-slate-700">{currentStep}</p>
    <p className="text-sm text-slate-500">The AI agents are at work...</p>
  </div>
);

const InitialState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8 bg-slate-100 rounded-lg">
    <p className="text-lg">Your explanation will appear here.</p>
    <p className="mt-2 text-sm">Please provide an image and a question to get started.</p>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-red-700 p-8 bg-red-50 rounded-lg border border-red-200">
    <p className="text-lg font-bold">An Error Occurred</p>
    <p className="mt-2 text-sm">{message}</p>
  </div>
);

const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 transition-all duration-500 ease-in-out animate-fade-in">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="pl-9 text-slate-700 text-sm">
      {children}
    </div>
  </div>
);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  isLoading,
  currentStep,
  error,
  extractedData,
  researchData,
  finalExplanation,
}) => {
  if (isLoading) return <LoadingState currentStep={currentStep} />;
  if (error) return <ErrorState message={error} />;

  const hasResults = extractedData || researchData || finalExplanation;

  if (!hasResults) return <InitialState />;

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      {extractedData && (
        <ResultCard icon={<AnalystIcon className="w-6 h-6 text-sky-600" />} title="Lab Report Analyst">
          {extractedData.lab_values.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {extractedData.lab_values.map((item, index) => (
                <li key={index}>
                  <strong>{item.test_name}:</strong> {item.value} {item.unit} (Range: {item.standard_range || 'N/A'})
                </li>
              ))}
            </ul>
          ) : <p>No specific values found for your query.</p>}
        </ResultCard>
      )}

      {researchData && (
        <ResultCard icon={<ResearcherIcon className="w-6 h-6 text-teal-600" />} title="Medical Researcher">
            <p className="whitespace-pre-wrap">{researchData.summary}</p>
            {researchData.sources && researchData.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                    <h4 className="font-semibold text-xs text-slate-500 mb-1">Sources:</h4>
                    <ul className="space-y-1">
                        {researchData.sources.map((source, index) => source.web && (
                            <li key={index} className="flex items-start gap-1">
                                <SourceIcon className="w-3 h-3 text-slate-400 mt-1 flex-shrink-0" />
                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-700 hover:underline text-xs truncate">
                                    {source.web.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </ResultCard>
      )}

      {finalExplanation && (
        <div className="bg-cyan-50 border-l-4 border-cyan-500 p-5 rounded-r-lg animate-fade-in-strong">
            <div className="flex items-center gap-3 mb-3">
                <ExplainerIcon className="w-7 h-7 text-cyan-700" />
                <h3 className="text-xl font-bold text-cyan-900">Your Simplified Explanation</h3>
            </div>
            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap">
                {finalExplanation.split('\n\n').map((paragraph, index) => {
                    const isDisclaimer = paragraph.includes('This is an AI-generated summary');
                    return (
                        <p key={index} className={isDisclaimer ? 'text-xs text-slate-600 italic mt-4 pt-4 border-t border-cyan-200' : ''}>
                            {paragraph}
                        </p>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};
