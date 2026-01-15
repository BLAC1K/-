
import React from 'react';
import { Report, User, Role } from '../types';
import Avatar from './Avatar';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface ReportViewProps {
    report: Report;
    user: User; // The user who submitted the report
    viewerRole: Role;
    onClick: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, user, viewerRole, onClick }) => {
    const isManager = viewerRole === Role.MANAGER;
    
    const getStatus = () => {
        // واجهة المنتسب
        if (!isManager) {
            if (report.managerComment && !report.isCommentReadByEmployee) {
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                        توجيه جديد
                    </span>
                );
            }
            if (report.managerComment) {
                 return <span className="px-3 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full dark:bg-green-900/30 dark:text-green-300 dark:border-blue-800 font-cairo">تم التوجيه</span>;
            }
            return <span className="px-3 py-1 text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 rounded-full dark:bg-gray-700/50 dark:text-gray-400 dark:border-gray-600 font-cairo">تم الإرسال</span>;
        }
        
        // واجهة المسؤول (Manager) - الحالات المطلوبة
        
        // 1. إذا تم التعليق عليه (أولوية عالية)
        if (report.managerComment) {
            return (
                <span className="px-3 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 shadow-sm animate-fade-in font-cairo">
                    تم التعليق
                </span>
            );
        }

        // 2. إذا كان جديداً (لم يُقرأ)
        if (!report.isViewedByManager) {
            return (
                <div className="flex items-center gap-2 animate-fade-in">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                    </span>
                    <span className="px-3 py-1 text-[10px] font-extrabold text-white bg-blue-600 rounded-full shadow-lg shadow-blue-500/30 font-cairo">
                        جديد
                    </span>
                </div>
            );
        }

        // 3. إذا تمت قراءته
        return (
            <span className="px-3 py-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded-full dark:bg-gray-800/50 dark:text-gray-500 dark:border-gray-700 font-cairo transition-all duration-500">
                تمت قراءته
            </span>
        );
    }

    // تحديد لون الحدود بناءً على الحالة
    const getBorderClass = () => {
        if (!isManager) return 'border-gray-100 dark:border-gray-700';
        if (report.managerComment) return 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10';
        if (!report.isViewedByManager) return 'border-blue-400 ring-4 ring-blue-500/5 bg-blue-50/10 dark:bg-blue-900/5 dark:border-blue-800';
        return 'border-gray-100 dark:border-gray-700 opacity-80';
    };

    return (
        <div 
            className={`group overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border transition-all duration-300 active:scale-[0.98] cursor-pointer ${getBorderClass()} hover:border-brand-light`}
            onClick={onClick}
            role="button"
            aria-label={`عرض تقرير ${user.fullName} بتاريخ ${report.date}`}
        >
            <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} className="ring-2 ring-white dark:ring-gray-700 transition-transform group-hover:scale-105" />
                            {isManager && !report.isViewedByManager && !report.managerComment && (
                                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base leading-tight">{user.fullName}</p>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">{user.jobTitle}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-left ml-2">
                             <p className="text-[10px] font-bold text-brand-dark dark:text-brand-light">#{report.sequenceNumber}</p>
                             <p className="text-[9px] text-gray-400 font-medium">{report.date}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {getStatus()}
                            <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-brand-light group-hover:translate-x-[-4px] transition-all" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportView;
