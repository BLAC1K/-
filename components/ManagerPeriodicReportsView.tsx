import React, { useState, useMemo, useEffect } from 'react';
import { User, Report } from '../types';
import { useData } from '../context/DataContext';
import DocumentTextIcon from './icons/DocumentTextIcon';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface PeriodicReport {
    id: string;
    title: string;
    type: 'monthly' | 'half-yearly' | 'yearly';
    periodStr: string;
    content: string; // The editable text
    createdAt: string;
    userId: string;
}

const ManagerPeriodicReportsView: React.FC = () => {
    const { users, reports } = useData();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [savedReports, setSavedReports] = useState<PeriodicReport[]>([]);

    const employees = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

    // In a real app we'd load this from a remote database. Just falling back to local storage since no API exists for this entity
    useEffect(() => {
        if (!selectedEmployeeId) {
            setSavedReports([]);
            return;
        }
        
        const localData = localStorage.getItem(`periodic_reports_${selectedEmployeeId}`);
        if (localData) {
            try {
                setSavedReports(JSON.parse(localData));
            } catch (e) {
                console.error("Failed to parse local periodic reports", e);
            }
        } else {
            setSavedReports([]);
        }
    }, [selectedEmployeeId]);

    return (
        <div id="printable-area" className="space-y-6 animate-fade-in print:bg-white print:text-black">
            <div className="flex flex-col md:flex-row items-start justify-between border-b dark:border-gray-700 pb-4 gap-4 print:hidden">
                <div>
                    <h3 className="text-2xl font-bold text-brand-dark dark:text-gray-100">التقارير الدورية للمنتسبين</h3>
                    <p className="text-gray-500 dark:text-gray-400">استطلاع التقارير الدورية (الشهرية، النصف سنوية، أو السنوية) المولدة من قبل المنتسبين.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 print:hidden">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">اختر المنتسب לעرض تقاريره الدورية:</label>
                <select 
                    value={selectedEmployeeId} 
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light dark:text-gray-100 transition-all font-bold"
                >
                    <option value="">-- يرجى اختيار منتسب --</option>
                    {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.fullName} - {e.jobTitle}</option>
                    ))}
                </select>
            </div>

            {selectedEmployeeId && (
                <div className="space-y-4 pt-4">
                    {savedReports.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-gray-500 font-bold">هذا المنتسب لم يقم بتوليد أي تقارير دورية بعد.</p>
                        </div>
                    ) : (
                        savedReports.map(report => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full uppercase">
                                        {report.type === 'monthly' ? 'شهري' : report.type === 'half-yearly' ? 'نصف سنوي' : 'سنوي'}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString('ar-EG')}</span>
                                    <button onClick={() => window.print()} className="ml-auto text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-brand-dark dark:text-white transition-all print:hidden mr-auto font-bold">
                                        طباعة
                                    </button>
                                </div>
                                <h4 className="text-xl font-bold dark:text-white border-b dark:border-gray-700 pb-2">{report.title}</h4>
                                <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap dark:text-gray-300 font-medium">
                                    {report.content}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ManagerPeriodicReportsView;
