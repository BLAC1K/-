
import React, { useEffect } from 'react';
import { Report, User, Role } from '../types';
import { useData } from '../context/DataContext';
import ReportDetail from './ReportDetail';
import XCircleIcon from './icons/XCircleIcon';
import Avatar from './Avatar';
import DownloadIcon from './icons/DownloadIcon';

interface ReportDetailModalProps {
    report: Report;
    user: User;
    viewerRole: Role;
    onClose: () => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, user, viewerRole, onClose }) => {
    const { markReportAsViewed, markCommentAsRead } = useData();

    useEffect(() => {
        if (viewerRole === Role.MANAGER && !report.isViewedByManager) {
            markReportAsViewed(report.id);
        }
        if (viewerRole === Role.EMPLOYEE && report.managerComment && !report.isCommentReadByEmployee) {
            markCommentAsRead(report.id);
        }
    }, [report, viewerRole, markReportAsViewed, markCommentAsRead]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog" onClick={onClose}>
            <div id="printable-report" className="relative w-full h-full sm:max-w-3xl sm:h-[85vh] sm:rounded-lg bg-white dark:bg-gray-800 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Print Only Header */}
                <div className="hidden print:block border-b-2 border-black mb-6 pb-4">
                    <div className="flex justify-between items-start">
                        <div className="text-right space-y-1">
                            <h2 className="text-xl font-bold">شعبة الفنون والمسرح</h2>
                            <p className="font-semibold text-lg">الوحدة: {user.unit || 'غير محدد'}</p>
                            <p className="font-medium mt-2">الاسم: {user.fullName}</p>
                            <p className="font-medium">العنوان الوظيفي: {user.jobTitle}</p>
                            <p className="font-medium">رقم الباج: {user.badgeNumber}</p>
                        </div>
                        <div className="text-left space-y-1 mt-4">
                             <p className="font-bold text-lg">العدد: {report.sequenceNumber}</p>
                             <p className="font-medium">التاريخ: {report.date}</p>
                             <p className="font-medium">اليوم: {report.day}</p>
                        </div>
                    </div>
                </div>

                {/* Screen Header (Hidden on Print) */}
                <div className="p-4 border-b dark:border-gray-700 no-print">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                             <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                             <div>
                                <h3 className="text-lg font-bold text-brand-dark dark:text-gray-100">التقرير رقم {report.sequenceNumber}: {user.fullName}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">بتاريخ {report.date}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-brand-light hover:bg-brand-dark"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">طباعة / PDF</span>
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <XCircleIcon className="w-7 h-7"/>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <ReportDetail report={report} user={user} viewerRole={viewerRole} />
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;
