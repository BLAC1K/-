
import React from 'react';
import { Report, User, Role } from '../types';
import Avatar from './Avatar';
import ChevronRightIcon from './icons/ChevronRightIcon';
import CommentIcon from './icons/CommentIcon';

interface ReportViewProps {
    report: Report;
    user: User;
    viewerRole: Role;
    onClick: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, user, viewerRole, onClick }) => {
    const isManager = viewerRole === Role.MANAGER;
    
    const getStatusIndicator = () => {
        if (!isManager) {
            if (report.managerComment && !report.isCommentReadByEmployee) {
                return <span className="px-3 py-1 text-[9px] font-black text-white bg-brand-light rounded-full animate-pulse uppercase tracking-wider">توجيه جديد</span>;
            }
            if (report.managerComment) {
                 return <span className="px-3 py-1 text-[9px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-900/30 uppercase tracking-wider">تم التوجيه</span>;
            }
            return null;
        }
        
        if (isManager) {
            if (report.managerComment) {
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full border border-green-100 dark:border-green-900/30">
                        <CommentIcon className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">تم الرد</span>
                    </div>
                );
            }
            
            if (!report.isViewedByManager) {
                return (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-light text-white rounded-full shadow-lg shadow-brand-light/20">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest">جديد</span>
                    </div>
                );
            }

            return (
                <span className="px-3 py-1 text-[9px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 uppercase tracking-wider">
                    مقروء
                </span>
            );
        }

        return null;
    }

    return (
        <div 
            className={`group relative bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-sm hover:shadow-md border border-white dark:border-gray-800 cursor-pointer transition-all duration-300 active:scale-[0.98] ${isManager && !report.isViewedByManager ? 'ring-1 ring-brand-light/20' : ''}`}
            onClick={onClick}
            role="button"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} className="ring-2 ring-gray-50 dark:ring-gray-800" />
                        {isManager && !report.isViewedByManager && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-light border-2 border-white dark:border-gray-900 rounded-full"></span>
                        )}
                    </div>
                    <div>
                        <p className="font-black text-gray-800 dark:text-white text-sm leading-tight">{user.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{report.date} • تقرير #{report.sequenceNumber}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {getStatusIndicator()}
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-300 group-hover:text-brand-light transition-colors">
                            <ChevronRightIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportView;
