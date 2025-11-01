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
        if (!isManager) {
            if (report.managerComment && !report.isCommentReadByEmployee) {
                return <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">تعليق جديد</span>;
            }
            if (report.managerComment) {
                 return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">تم التعليق</span>;
            }
            if (report.isViewedByManager) {
                return <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">تمت المشاهدة</span>;
            }
            return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">تم الإرسال</span>;
        }
        return null;
    }

    return (
        <div 
            className={`overflow-hidden bg-white rounded-lg shadow-md border cursor-pointer hover:shadow-lg hover:border-brand-light transition-all duration-200 ${!report.isViewedByManager && isManager ? 'border-2 border-brand-light' : 'border-gray-200'}`}
            onClick={onClick}
            role="button"
            aria-label={`عرض تقرير ${user.fullName} بتاريخ ${report.date}`}
        >
            <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                        <div>
                            <p className="font-semibold text-brand-dark">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.jobTitle}</p>
                        </div>
                    </div>
                     <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="text-left">
                             <p className="text-sm font-semibold text-brand-dark">التقرير رقم: {report.sequenceNumber}</p>
                             <p className="text-xs text-gray-500">{report.date} - {report.day}</p>
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