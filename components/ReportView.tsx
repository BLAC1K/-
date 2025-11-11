import React from 'react';
import { Report, User, Role } from '../types';
import Avatar from './Avatar';
import ChevronRightIcon from './icons/ChevronRightIcon';
import CommentIcon from './icons/CommentIcon';

interface ReportViewProps {
    report: Report;
    user: User; // The user who submitted the report
    viewerRole: Role;
    onClick: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ report, user, viewerRole, onClick }) => {
    const isManager = viewerRole === Role.MANAGER;
    
    const getStatus = () => {
        if (!isManager) {
            if (report.managerComment && !report.isCommentReadByEmployee) {
                return <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/50 dark:text-blue-300">تعليق جديد</span>;
            }
            if (report.managerComment) {
                 return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900/50 dark:text-green-300">تم التعليق</span>;
            }
            if (report.isViewedByManager) {
                return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-600 dark:text-gray-200">تمت المشاهدة</span>;
            }
            return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-900/50 dark:text-yellow-300">تم الإرسال</span>;
        }
        
        if (isManager && report.managerComment) {
            return (
                <div className="flex items-center text-green-600 dark:text-green-400" title="تم التعليق على هذا التقرير">
                    <CommentIcon className="w-5 h-5" />
                    <span className="mr-1 text-xs font-semibold">تم التعليق</span>
                </div>
            );
        }

        return null;
    }

    return (
        <div 
            className={`overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md border cursor-pointer hover:shadow-lg hover:border-brand-light dark:hover:border-brand-light transition-all duration-200 ${!report.isViewedByManager && isManager ? 'border-2 border-brand-light' : 'border-gray-200 dark:border-gray-700'}`}
            onClick={onClick}
            role="button"
            aria-label={`عرض تقرير ${user.fullName} بتاريخ ${report.date}`}
        >
            <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                        <div>
                            <p className="font-semibold text-brand-dark dark:text-gray-100">{user.fullName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.jobTitle}</p>
                        </div>
                    </div>
                     <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="text-left">
                             <p className="text-sm font-semibold text-brand-dark dark:text-gray-200">التقرير رقم: {report.sequenceNumber}</p>
                             <p className="text-xs text-gray-500 dark:text-gray-400">{report.date} - {report.day}</p>
                        </div>
                         {getStatus()}
                         <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportView;