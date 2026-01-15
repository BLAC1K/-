
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { User, Report } from '../types';
import PercentageCircle from './StarRating';
import SparklesIcon from './icons/SparklesIcon';

interface MonthlyEvaluationProps {
    employee: User;
    reportsForMonth: Report[];
    year: string;
    month: string;
}

const MonthlyEvaluation: React.FC<MonthlyEvaluationProps> = ({ employee, reportsForMonth, year, month }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const monthName = useMemo(() => {
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
        return date.toLocaleString('ar-EG', { month: 'long', timeZone: 'UTC' });
    }, [year, month]);

    const metrics = useMemo(() => {
        const totalReports = reportsForMonth.length;
        const ratings = reportsForMonth.map(r => r.rating).filter((r): r is number => typeof r === 'number');
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const totalTasks = reportsForMonth.reduce((sum, r) => sum + r.tasks.length, 0);
        const notAccomplishedCount = reportsForMonth.filter(r => r.notAccomplished && r.notAccomplished.trim() !== '').length;
        const commitmentRate = Math.min((totalReports / 22) * 100, 100);

        return { totalReports, avgRating, totalTasks, notAccomplishedCount, commitmentRate };
    }, [reportsForMonth]);
    
    useEffect(() => {
        const generateSummary = async () => {
            if (reportsForMonth.length === 0) {
                setSummary('لا توجد بيانات كافية لإنشاء ملخص تقييم لهذا الشهر.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const accomplishedSummary = reportsForMonth
                    .map(r => r.accomplished)
                    .filter(a => a && a.trim() !== '')
                    .map(a => `- ${a.trim()}`)
                    .join('\n');
                    
                const prompt = `
تحليل أداء المنتسب "${employee.fullName}" لشهر ${monthName} ${year}.
البيانات:
- عدد التقارير المرفوعة: ${metrics.totalReports}
- نسبة التقييم العام: ${metrics.avgRating.toFixed(1)}%
- ملخص الإنجازات المذكورة:
${accomplishedSummary || "لم تذكر إنجازات تفصيلية."}

بناءً على هذه البيانات، قدم تقييماً مهنياً موجزاً لأداء المنتسب باللغة العربية في 3-5 نقاط مركزة.
`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });

                setSummary(response.text || "لم يتمكن النظام من توليد ملخص في الوقت الحالي.");
            } catch (err: any) {
                console.error("Evaluation Error:", err);
                setError('تعذر إنشاء التقييم الذكي حالياً.');
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();

    }, [reportsForMonth, employee.fullName, year, monthName, metrics]);


    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                خلاصة أداء المنتسب لشهر {monthName} {year}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6 text-center">
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">نسبة التقييم</p>
                    <PercentageCircle percentage={metrics.avgRating} size={50} strokeWidth={5} />
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">نسبة الالتزام</p>
                    <PercentageCircle percentage={metrics.commitmentRate} size={50} strokeWidth={5} />
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100">{metrics.totalReports}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400">تقارير منجزة</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100">{metrics.totalTasks}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400">مهمة منفذة</p>
                </div>
                 <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100">{metrics.notAccomplishedCount}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400">معوقات مرصودة</p>
                </div>
            </div>

            <div>
                <h5 className="flex items-center font-semibold text-md text-gray-800 dark:text-gray-200 mb-2">
                    <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                    تحليل الأداء الذكي (AI)
                </h5>
                <div className="p-4 bg-blue-50 dark:bg-gray-900/40 rounded-lg min-h-[80px] text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-gray-700">
                    {isLoading && <p className="animate-pulse">جارِ تحليل أداء المنتسب...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!isLoading && !error && <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>}
                </div>
            </div>
        </div>
    );
};

export default MonthlyEvaluation;
