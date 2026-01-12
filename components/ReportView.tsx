
import React from 'react';
import { Report, User, Role } from '../types';
import Avatar from './Avatar';
import ChevronRightIcon from './icons/ChevronRightIcon';
import CommentIcon from './icons/CommentIcon';

interface ReportViewProps {
    report: Report;
    user: User; // المنتسب الذي أرسل التقرير
    viewerRole: Role;
    onClick: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, user, viewerRole, onClick }) => {
    const isManager = viewerRole === Role.MANAGER;
    
    const getStatusIndicator = () => {
        // حالة واجهة المنتسب
        if (!isManager) {
            if (report.managerComment && !report.isCommentReadByEmployee) {
                return <span className="px-2 py-1 text-[10px] font-bold text-white bg-blue-500 rounded-lg animate-pulse">توجيه جديد</span>;
            }
            if (report.managerComment) {
                 return <span className="px-2 py-1 text-[10px] font-bold text-green-600 bg-green-50 rounded-lg border border-green-100">تم التوجيه</span>;
            }
            return null;
        }
        
        // حالة واجهة المسؤول
        if (isManager) {
            if (report.managerComment) {
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/30">
                        <CommentIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase">تم التعليق</span>
                    </div>
                );
            }
            
            if (!report.isViewedByManager) {
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-light text-white rounded-full shadow-sm animate-fade-in">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">جديد</span>
                    </div>
                );
            }

            return (
                <span className="px-3 py-1 text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-full border border-gray-100 dark:border-gray-600">
                    تمت المشاهدة
                </span>
            );
        }

        return null;
    }

    // تحديد ألوان البطاقة بناءً على الحالة للمسؤول
    const getCardStyles = () => {
        if (!isManager) return 'border-gray-100 dark:border-gray-700';
        
        if (report.managerComment) {
            return 'border-green-200 dark:border-green-900/50 bg-green-50/5 dark:bg-green-900/5 hover:border-green-400';
        }
        if (!report.isViewedByManager) {
            return 'border-brand-light ring-1 ring-brand-light/20 bg-brand-light/5 dark:bg-brand-light/5 shadow-md scale-[1.01]';
        }
        return 'border-gray-100 dark:border-gray-700 opacity-90';
    };

    return (
        <div 
            className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border cursor-pointer transition-all duration-300 active:scale-95 ${getCardStyles()}`}
            onClick={onClick}
            role="button"
        >
            <div className="px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar src={user.profilePictureUrl} name={user.fullName} size={42} />
                            {isManager && !report.isViewedByManager && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-light border-2 border-white dark:border-gray-800 rounded-full"></span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-brand-dark dark:text-gray-100 text-sm md:text-base leading-tight">{user.fullName}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{user.jobTitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-left hidden sm:block">
                             <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">تقرير #{report.sequenceNumber}</p>
                             <p className="text-[9px] text-gray-400">{report.date}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {getStatusIndicator()}
                            <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-brand-light group-hover:translate-x-[-4px] transition-all" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* مؤشر مرئي بسيط في طرف البطاقة للتقارير الجديدة */}
            {isManager && !report.isViewedByManager && (
                <div className="absolute top-0 right-0 w-1.5 h-full bg-brand-light"></div>
            )}
        </div>
    );
};

export default ReportView;
