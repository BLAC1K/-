
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI } from '@google/genai';
import { User, Report } from '../types';
import PercentageCircle from './StarRating';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

interface MonthlyEvaluationProps {
    employee: User;
    reportsForMonth: Report[];
    year: string;
    month: string;
    onViewReport: (report: Report) => void;
}

const MonthlyEvaluation: React.FC<MonthlyEvaluationProps> = ({ employee, reportsForMonth, year, month, onViewReport }) => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeDetail, setActiveDetail] = useState<'reports' | 'tasks' | 'obstacles' | null>(null);

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
                setSummary('لا توجد بيانات كافية لإنشاء ملخص لهذا الشهر.');
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
تحليل أداء الموظف "${employee.fullName}" لشهر ${monthName} ${year}.
البيانات:
- التقارير: ${metrics.totalReports}
- التقييم: ${metrics.avgRating.toFixed(1)}%
- الإنجازات:
${accomplishedSummary || "لم تذكر إنجازات محددة."}

قدم تقييماً مهنياً موجزاً باللغة العربية في 3-5 نقاط.
`;
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });

                setSummary(response.text || "لم يتمكن الذكاء الاصطناعي من توليد ملخص.");
            } catch (err: any) {
                console.error("Evaluation Error:", err);
                setError('تعذر إنشاء الملخص حالياً.');
            } finally {
                setIsLoading(false);
            }
        };

        generateSummary();

    }, [reportsForMonth, employee.fullName, year, monthName, metrics]);

    // Data extraction for details modal
    const detailData = useMemo(() => {
        if (activeDetail === 'tasks') {
            return reportsForMonth.flatMap(r => r.tasks.map(t => ({ 
                id: t.id, 
                content: t.text, 
                date: r.date, 
                day: r.day,
                report: r 
            })));
        }
        if (activeDetail === 'obstacles') {
            return reportsForMonth
                .filter(r => r.notAccomplished && r.notAccomplished.trim() !== '')
                .map(r => ({ 
                    id: r.id, 
                    content: r.notAccomplished, 
                    date: r.date, 
                    day: r.day,
                    report: r 
                }));
        }
        if (activeDetail === 'reports') {
            return reportsForMonth.map(r => ({
                id: r.id,
                content: `تقرير يوم ${r.day}`,
                status: r.status,
                rating: r.rating,
                date: r.date,
                day: r.day,
                report: r
            }));
        }
        return [];
    }, [activeDetail, reportsForMonth]);

    const getModalTitle = () => {
        switch (activeDetail) {
            case 'tasks': return 'سجل المهام المنجزة';
            case 'obstacles': return 'سجل المعوقات والمقترحات';
            case 'reports': return 'أرشيف التقارير';
            default: return '';
        }
    };

    const getModalIcon = () => {
         switch (activeDetail) {
            case 'tasks': return <ClipboardDocumentListIcon className="w-6 h-6 text-blue-500" />;
            case 'obstacles': return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
            case 'reports': return <DocumentTextIcon className="w-6 h-6 text-brand-light" />;
            default: return null;
        }
    };

    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                تقييم شهر {monthName} {year}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6 text-center">
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">التقييم</p>
                    <PercentageCircle percentage={metrics.avgRating} size={50} strokeWidth={5} />
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">الالتزام</p>
                    <PercentageCircle percentage={metrics.commitmentRate} size={50} strokeWidth={5} />
                </div>
                
                <button 
                    onClick={() => setActiveDetail('reports')}
                    className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer group active:scale-95 hover:shadow-md"
                >
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100 group-hover:scale-110 transition-transform">{metrics.totalReports}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold group-hover:text-brand-light">تقارير (عرض)</p>
                </button>
                
                <button 
                    onClick={() => setActiveDetail('tasks')}
                    className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer group active:scale-95 hover:shadow-md"
                >
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100 group-hover:scale-110 transition-transform">{metrics.totalTasks}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold group-hover:text-brand-light">مهام (عرض)</p>
                </button>
                
                <button 
                    onClick={() => setActiveDetail('obstacles')}
                    className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer group active:scale-95 hover:shadow-md"
                >
                     <p className="text-xl font-bold text-brand-dark dark:text-gray-100 group-hover:scale-110 transition-transform group-hover:text-red-500">{metrics.notAccomplishedCount}</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold group-hover:text-red-500">معوقات (عرض)</p>
                </button>
            </div>

            <div>
                <h5 className="flex items-center font-semibold text-md text-gray-800 dark:text-gray-200 mb-2">
                    <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                    تحليل الأداء الذكي
                </h5>
                <div className="p-4 bg-blue-50 dark:bg-gray-900/40 rounded-lg min-h-[80px] text-sm text-gray-700 dark:text-gray-300 border border-blue-100 dark:border-gray-700">
                    {isLoading && <p className="animate-pulse">جارِ التحليل...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!isLoading && !error && <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br />') }}></div>}
                </div>
            </div>

            {/* نافذة التفاصيل المنبثقة - باستخدام Portal لحل مشكلة التداخل */}
            {activeDetail && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in" onClick={() => setActiveDetail(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                    {getModalIcon()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{getModalTitle()}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">عدد السجلات: {detailData.length}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveDetail(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/20">
                            {detailData.length > 0 ? (
                                detailData.map((item, index) => (
                                    <div 
                                        key={index} 
                                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-brand-light/20 transition-all duration-300"
                                    >
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-brand-light text-white text-[10px] font-bold rounded-lg shadow-sm shadow-brand-light/30">
                                                    {item.date}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                                    {item.day}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-relaxed border-r-2 border-brand-light/20 pr-3 mr-1">
                                                {item.content}
                                            </p>
                                        </div>
                                        
                                        <button 
                                            onClick={() => { setActiveDetail(null); onViewReport(item.report); }}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-brand-light bg-brand-light/5 border border-brand-light/20 rounded-xl hover:bg-brand-light hover:text-white hover:shadow-md transition-all shrink-0 active:scale-95 whitespace-nowrap"
                                            title="عرض التقرير الأصلي الكامل"
                                        >
                                            <span>عرض التقرير</span>
                                            <ChevronLeftIcon className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                        <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 font-medium">لا توجد سجلات لعرضها في هذا القسم.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MonthlyEvaluation;
