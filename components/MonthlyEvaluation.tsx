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
        // Create a date in UTC to avoid timezone issues
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
        return date.toLocaleString('ar-EG', { month: 'long', timeZone: 'UTC' });
    }, [year, month]);

    const metrics = useMemo(() => {
        const totalReports = reportsForMonth.length;
        const ratings = reportsForMonth.map(r => r.rating).filter((r): r is number => typeof r === 'number');
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const totalTasks = reportsForMonth.reduce((sum, r) => sum + r.tasks.length, 0);
        const notAccomplishedCount = reportsForMonth.filter(r => r.notAccomplished && r.notAccomplished.trim() !== '').length;
        const commitmentRate = Math.min((totalReports / 22) * 100, 100); // Assume 22 work days, cap at 100%

        return { totalReports, avgRating, totalTasks, notAccomplishedCount, commitmentRate };
    }, [reportsForMonth]);
    
    useEffect(() => {
        const generateSummary = async () => {
            if (reportsForMonth.length === 0) {
                setSummary('لا توجد بيانات كافية لإنشاء ملخص لهذا الشهر.');
                setIsLoading(false);
                setError('');
                return;
            }

            setIsLoading(true);
            setError('');
            setSummary('');

            const MAX_RETRIES = 3;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                    
                    const accomplishedSummary = reportsForMonth
                        .map(r => r.accomplished)
                        .filter(a => a && a.trim() !== '')
                        .map(a => `- ${a.trim()}`)
                        .join('\n');
                        
                    const notAccomplishedSummary = reportsForMonth
                        .map(r => r.notAccomplished)
                        .filter(na => na && na.trim() !== '')
                        .map(na => `- ${na.trim()}`)
                        .join('\n');

                    const prompt = `
أنت مدير موارد بشرية خبير. قم بتحليل بيانات أداء الموظف "${employee.fullName}" لشهر ${monthName} ${year} وقدم ملخصًا تقييميًا موجزًا واحترافيًا باللغة العربية في نقاط.
ركز على النقاط الإيجابية ومجالات التحسين المحتملة. لا تتجاوز 5 نقاط.

بيانات الأداء:
- إجمالي التقارير المقدمة: ${metrics.totalReports}
- متوسط التقييم من المدير: ${metrics.avgRating.toFixed(1)}%
- إجمالي المهام المسندة: ${metrics.totalTasks}
- عدد التقارير التي ذكر فيها مهام لم تنجز: ${metrics.notAccomplishedCount}
- نسبة الالتزام بتقديم التقارير (بافتراض 22 يوم عمل): ${metrics.commitmentRate.toFixed(0)}%

أبرز الإنجازات المذكورة في التقارير:
${accomplishedSummary || "لم تذكر إنجازات محددة."}

أبرز المهام التي لم تنجز:
${notAccomplishedSummary || "لم تذكر مهام لم تنجز."}

اكتب ملخصك أدناه:
`;
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });

                    setSummary(response.text);
                    setIsLoading(false); // Success
                    setError('');
                    return; // Exit function on success

                } catch (err: any) {
                    console.error(`Error on attempt ${attempt}:`, err);
                    const errorMessage = err.toString();

                    const isOverloaded = errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('overloaded');

                    if (isOverloaded && attempt < MAX_RETRIES) {
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        if (isOverloaded) {
                             setError('النموذج مشغول حاليًا. الرجاء المحاولة مرة أخرى لاحقًا.');
                        } else {
                            setError('حدث خطأ أثناء إنشاء الملخص. الرجاء المحاولة مرة أخرى.');
                        }
                        setIsLoading(false);
                        return; // Exit function on final failure
                    }
                }
            }
        };

        generateSummary();

    }, [reportsForMonth, employee.fullName, year, monthName, metrics]);


    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                تقييم شهر {monthName} {year}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6 text-center">
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">متوسط التقييم</p>
                    <PercentageCircle percentage={metrics.avgRating} size={50} strokeWidth={5} />
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">الالتزام</p>
                    <PercentageCircle percentage={metrics.commitmentRate} size={50} strokeWidth={5} />
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">{metrics.totalReports}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">تقارير مقدمة</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">{metrics.totalTasks}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">مهمة مسندة</p>
                </div>
                 <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center">
                     <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">{metrics.notAccomplishedCount}</p>
                     <p className="text-xs text-gray-500 dark:text-gray-400">تقارير غير مكتملة</p>
                </div>
            </div>

            <div>
                <h5 className="flex items-center font-semibold text-md text-gray-800 dark:text-gray-200 mb-2">
                    <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                    ملخص الأداء (بواسطة الذكاء الاصطناعي)
                </h5>
                <div className="p-4 bg-blue-50 dark:bg-gray-900/40 rounded-lg min-h-[100px] text-sm text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-gray-700">
                    {isLoading && <p>جارِ إنشاء الملخص...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!isLoading && !error && <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>}
                </div>
            </div>
        </div>
    );
};

export default MonthlyEvaluation;