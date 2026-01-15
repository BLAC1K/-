
import React, { useState, useCallback } from 'react';
import { Report } from '../types';
import { GoogleGenAI } from '@google/genai';
import SparklesIcon from './icons/SparklesIcon';

interface AIReportAnalysisProps {
    report: Report;
}

const AIReportAnalysis: React.FC<AIReportAnalysisProps> = ({ report }) => {
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [wasGenerated, setWasGenerated] = useState(false);

    const generateAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            // Fix: Access process.env.API_KEY directly as per GenAI guidelines
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const tasksSummary = report.tasks.map(t => `- ${t.text}`).join('\n');
            
            const prompt = `
قم بتحليل التقرير التالي للمنتسب وقدم ملخصاً للمدير:
- المهام: ${tasksSummary}
- المنجز: ${report.accomplished}
- المعوقات: ${report.notAccomplished}

قدم تحليلاً في نقاط موجزة ومهنية باللغة العربية.
`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });

            setAnalysis(response.text || "لم يتوفر تحليل.");
            setWasGenerated(true);

        } catch (err) {
            console.error("AI Analysis Error:", err);
            setError('خطأ في الاتصال بالخدمة الذكية.');
        } finally {
            setIsLoading(false);
        }
    }, [report]);

    return (
        <div className="sm:col-span-2 pt-6 mt-6 border-t dark:border-gray-700 no-print">
            <h4 className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                تحليل التقرير (AI)
            </h4>
            <div className="mt-2 p-4 bg-brand-light/5 dark:bg-gray-900/40 rounded-lg border border-brand-light/20">
                {!wasGenerated ? (
                    <div className="text-center py-2">
                        <button
                            onClick={generateAnalysis}
                            disabled={isLoading}
                            className="px-4 py-2 text-xs font-bold text-white bg-brand-light rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isLoading ? 'جارِ التحليل...' : 'إنشاء تحليل ذكي'}
                        </button>
                    </div>
                ) : (
                    <>
                        {isLoading && <p className="text-sm animate-pulse">جارِ التحليل...</p>}
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {analysis && (
                            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIReportAnalysis;
