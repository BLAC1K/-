import React, { useState, useMemo, useEffect } from 'react';
import { User, Report } from '../types';
import DocumentTextIcon from './icons/DocumentTextIcon';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import XMarkIcon from './icons/XMarkIcon';

interface PeriodicReport {
    id: string;
    title: string;
    type: 'monthly' | 'half-yearly' | 'yearly';
    periodStr: string;
    content: string; // The editable text
    createdAt: string;
}

interface PeriodicReportsViewProps {
    user: User;
    reports: Report[]; // Daily reports to extract data from
}

const PeriodicReportsView: React.FC<PeriodicReportsViewProps> = ({ user, reports }) => {
    const [savedPeriodicReports, setSavedPeriodicReports] = useState<PeriodicReport[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
    const [currentReport, setCurrentReport] = useState<Partial<PeriodicReport>>({});
    
    // Modal state for generating reports
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<'monthly' | 'half-yearly' | 'yearly'>('monthly');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
    const [selectedHalf, setSelectedHalf] = useState<number>(0); // 0 = first half, 1 = second half

    // Generate years from 2020 to current year + 1
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => 2020 + i);
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // Load from local storage
    useEffect(() => {
        const localData = localStorage.getItem(`periodic_reports_${user.id}`);
        if (localData) {
            try {
                setSavedPeriodicReports(JSON.parse(localData));
            } catch (e) {
                console.error("Failed to parse local periodic reports", e);
            }
        }
    }, [user.id]);

    // Save to local storage
    const saveToLocal = (reportsToSave: PeriodicReport[]) => {
        setSavedPeriodicReports(reportsToSave);
        localStorage.setItem(`periodic_reports_${user.id}`, JSON.stringify(reportsToSave));
    };

    const openGenerateModal = (type: 'monthly' | 'half-yearly' | 'yearly') => {
        setSelectedType(type);
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        setSelectedHalf(today.getMonth() < 6 ? 0 : 1);
        setIsModalOpen(true);
    };

    const handleGenerate = () => {
        setIsModalOpen(false);
        const targetMonth = selectedMonth;
        const targetYear = selectedYear;
        let periodStr = '';
        
        let filteredDailyReports = [];

        if (selectedType === 'monthly') {
            periodStr = `شهر ${months[targetMonth]} / ${targetYear}`;
            filteredDailyReports = reports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getMonth() === targetMonth && rDate.getFullYear() === targetYear;
            });
        } else if (selectedType === 'half-yearly') {
            const isFirstHalf = selectedHalf === 0;
            periodStr = `النصف ${isFirstHalf ? 'الأول' : 'الثاني'} من عام ${targetYear}`;
            filteredDailyReports = reports.filter(r => {
                const rDate = new Date(r.date);
                const rMonth = rDate.getMonth();
                return rDate.getFullYear() === targetYear && (isFirstHalf ? rMonth < 6 : rMonth >= 6);
            });
        } else if (selectedType === 'yearly') {
            periodStr = `عام ${targetYear}`;
            filteredDailyReports = reports.filter(r => {
                const rDate = new Date(r.date);
                return rDate.getFullYear() === targetYear;
            });
        }

        // Generate content text
        let contentStr = `المهام المنجزة خلال (${periodStr}):\n\n`;
        let totalCompleted = 0;

        filteredDailyReports.forEach(r => {
            // "يتم اضافم المهام المنجزة تلقائي من المهام اليومية مع ذكر التفاصيل مثل الشهر واليوم"
            const dateObj = new Date(r.date);
            const dateFormatted = dateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
            
            // Assume any task with text is a task. If 'isDone' flag is used, filter by it.
            // But we will include tasks that have text and were marked done, or if app doesn't strictly use isDone, we include all non-empty from submitted reports. 
            // In the provided app we have `r.tasks.filter(t => t.text.trim() !== '')`
            const validTasks = r.tasks.filter(t => t.text.trim() !== '' && String(t.isDone) !== 'false');

            if (validTasks.length > 0) {
                contentStr += `■ تاريخ: ${r.date} (${r.day})\n`;
                validTasks.forEach((t, idx) => {
                    contentStr += `  - ${t.text}\n`;
                    totalCompleted++;
                });
                if (r.accomplished?.trim()) {
                    contentStr += `  * ملخص: ${r.accomplished}\n`;
                }
                contentStr += '\n';
            }
        });

        if (totalCompleted === 0) {
            contentStr += "لا يوجد مهام منجزة مسجلة في هذه الفترة.";
        }

        setCurrentReport({
            title: `تقرير ${selectedType === 'monthly' ? 'شهري' : selectedType === 'half-yearly' ? 'نصف سنوي' : 'سنوي'} - ${periodStr}`,
            type: selectedType,
            periodStr,
            content: contentStr
        });
        setViewMode('create');
    };

    const handleSave = () => {
        if (!currentReport.title || !currentReport.content) return;
        
        let updatedList = [...savedPeriodicReports];
        if (currentReport.id) {
            // Update
            updatedList = updatedList.map(r => r.id === currentReport.id ? currentReport as PeriodicReport : r);
        } else {
            // Create
            const newReport: PeriodicReport = {
                id: Date.now().toString(),
                title: currentReport.title,
                type: currentReport.type as any,
                periodStr: currentReport.periodStr || '',
                content: currentReport.content,
                createdAt: new Date().toISOString()
            };
            updatedList = [newReport, ...updatedList];
        }
        
        saveToLocal(updatedList);
        setViewMode('list');
    };

    const handleDelete = (id: string) => {
        const updatedList = savedPeriodicReports.filter(r => r.id !== id);
        saveToLocal(updatedList);
    };

    const handlePrint = () => {
        window.print();
    };

    if (viewMode === 'create' || viewMode === 'edit') {
        return (
            <div className="space-y-6 animate-fade-in print:bg-white print:text-black">
                <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4 print:hidden">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">{viewMode === 'edit' ? 'تعديل التقرير الدوري' : 'توليد تقرير دوري جديد'}</h3>
                        <p className="text-sm text-gray-500">تم جلب المهام المنجزة تلقائياً. يمكنك التعديل والاضافة.</p>
                    </div>
                    <button onClick={() => setViewMode('list')} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all font-bold text-sm">
                        رجوع للقائمة
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 print:border-none print:shadow-none print:p-0">
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1 block print:hidden">عنوان التقرير</label>
                        <input 
                            type="text" 
                            value={currentReport.title || ''} 
                            onChange={(e) => setCurrentReport(prev => ({...prev, title: e.target.value}))}
                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30 transition-all font-bold text-lg print:border-none print:bg-transparent print:p-0 print:text-2xl print:mb-6"
                            placeholder="عنوان التقرير..."
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1 block print:hidden">محتوى التقرير (قابل للتعديل)</label>
                        <textarea 
                            value={currentReport.content || ''} 
                            onChange={(e) => setCurrentReport(prev => ({...prev, content: e.target.value}))}
                            rows={15}
                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30 transition-all leading-relaxed print:hidden"
                            dir="rtl"
                        />
                        <div className="hidden print:block whitespace-pre-wrap leading-relaxed text-lg dark:text-white font-medium">
                            {currentReport.content}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 print:hidden">
                    <button onClick={handleSave} className="flex-1 py-4 bg-brand-light text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-light/30 hover:bg-brand-dark transition-all">
                        حفظ التقرير
                    </button>
                    <button onClick={handlePrint} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-white rounded-2xl font-bold text-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                        طباعة التقرير
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b dark:border-gray-700 pb-4 gap-4">
                <div>
                    <h3 className="text-xl font-bold dark:text-white">التقارير الدورية</h3>
                    <p className="text-sm text-gray-500 mt-1">توليد تقارير (شهرية، نصف سنوية، سنوية) تلقائياً من مهامك اليومية.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => openGenerateModal('monthly')} className="flex items-center gap-1 px-4 py-2 bg-brand-light/10 text-brand-light rounded-xl hover:bg-brand-light/20 transition-all font-bold text-sm">
                        <PlusIcon className="w-4 h-4" /> تقرير شهري
                    </button>
                    <button onClick={() => openGenerateModal('half-yearly')} className="flex items-center gap-1 px-4 py-2 bg-brand-light/10 text-brand-light rounded-xl hover:bg-brand-light/20 transition-all font-bold text-sm">
                         <PlusIcon className="w-4 h-4" /> تقرير نصف سنوي
                    </button>
                    <button onClick={() => openGenerateModal('yearly')} className="flex items-center gap-1 px-4 py-2 bg-brand-light/10 text-brand-light rounded-xl hover:bg-brand-light/20 transition-all font-bold text-sm">
                         <PlusIcon className="w-4 h-4" /> تقرير سنوي
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {savedPeriodicReports.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 font-bold">لا يوجد تقارير دورية محفوظة.</p>
                        <p className="text-sm text-gray-400 mt-1">اضغط على أزرار التوليد بالأعلى للبدء.</p>
                    </div>
                ) : (
                    savedPeriodicReports.map(report => (
                        <div key={report.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:border-brand-light transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full uppercase">
                                        {report.type === 'monthly' ? 'شهري' : report.type === 'half-yearly' ? 'نصف سنوي' : 'سنوي'}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <h4 className="text-lg font-bold dark:text-white line-clamp-1">{report.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button onClick={() => { setCurrentReport(report); setViewMode('edit'); }} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 text-brand-light bg-brand-light/10 rounded-xl hover:bg-brand-light/20 transition-all font-bold text-sm">
                                    <EditIcon className="w-4 h-4" /> <span>عرض وتعديل</span>
                                </button>
                                <button onClick={() => handleDelete(report.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for selecting year/month */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h3 className="text-xl font-bold dark:text-white">
                                {selectedType === 'monthly' ? 'توليد تقرير شهري' : selectedType === 'half-yearly' ? 'توليد تقرير نصف سنوي' : 'توليد تقرير سنوي'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">السنة:</label>
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light dark:text-white transition-all outline-none"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            {selectedType === 'monthly' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الشهر:</label>
                                    <select 
                                        value={selectedMonth} 
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light dark:text-white transition-all outline-none"
                                    >
                                        {months.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
                                    </select>
                                </div>
                            )}

                            {selectedType === 'half-yearly' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">النصف:</label>
                                    <select 
                                        value={selectedHalf} 
                                        onChange={(e) => setSelectedHalf(parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light dark:text-white transition-all outline-none"
                                    >
                                        <option value={0}>النصف الأول (يناير - يونيو)</option>
                                        <option value={1}>النصف الثاني (يوليو - ديسمبر)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all font-bold">إلغاء</button>
                            <button onClick={handleGenerate} className="px-5 py-2.5 bg-brand-light text-white rounded-xl shadow-md hover:bg-brand-dark transition-all font-bold">توليد التقرير</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodicReportsView;
