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
            <div id="printable-report" className="relative w-full h-full sm:max-w-3xl sm:h-[85vh] sm:rounded-lg bg-white shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                             <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                             <div>
                                <h3 className="text-lg font-bold text-brand-dark">التقرير رقم {report.sequenceNumber}: {user.fullName}</h3>
                                <p className="text-sm text-gray-500">بتاريخ {report.date}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2 no-print">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-brand-light hover:bg-brand-dark"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">حفظ كـ PDF</span>
                            </button>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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