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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            const tasksSummary = report.tasks.map(t => `- ${t.text}`).join('\n');
            
            const prompt = `
أنت مساعد إداري ذكي. مهمتك هي تحليل التقرير اليومي التالي وتقديم ملخص موجز للمدير باللغة العربية. ركز على النقاط التالية:
1. ملخص سريع للإنجازات الرئيسية المذكورة في قسم "ما تم إنجازه".
2. ملاحظة أي مهام لم تنجز مع ذكرها.
3. اقتراح نقاط لمناقشتها مع الموظف أو الثناء عليها بناءً على محتوى التقرير.

تفاصيل التقرير:
- تاريخ التقرير: ${report.date}
- المهام المخطط لها:
${tasksSummary || 'لم يتم تحديد مهام.'}
- ما تم إنجازه:
${report.accomplished || 'لم يحدد.'}
- ما لم يتم إنجازه:
${report.notAccomplished || 'لم يحدد.'}

قم بصياغة التحليل في شكل نقاط واضحة وموجزة. لا تقم بتضمين مقدمات أو خواتيم، فقط النقاط مباشرة.
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAnalysis(response.text);
            setWasGenerated(true);

        } catch (err) {
            console.error("Error generating AI analysis:", err);
            setError('حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    }, [report]);

    return (
        <div className="sm:col-span-2 pt-6 mt-6 border-t dark:border-gray-700 no-print">
            <h4 className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                تحليل التقرير (بواسطة الذكاء الاصطناعي)
            </h4>
            <div className="mt-2 p-4 bg-blue-50 dark:bg-gray-900/40 rounded-lg border border-blue-200 dark:border-gray-700">
                {!wasGenerated ? (
                    <div className="text-center">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            احصل على ملخص سريع ونقاط للمناقشة حول هذا التقرير.
                        </p>
                        <button
                            onClick={generateAnalysis}
                            disabled={isLoading}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light disabled:bg-opacity-50"
                        >
                            {isLoading ? 'جارِ التحليل...' : 'إنشاء تحليل'}
                        </button>
                    </div>
                ) : (
                    <>
                        {isLoading && <p className="text-sm text-gray-700 dark:text-gray-300">جارِ التحليل...</p>}
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {analysis && (
                            <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}></div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIReportAnalysis;
