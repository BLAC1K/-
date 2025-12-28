
import React, { useEffect, useState } from 'react';
import { Report, User, Role } from '../types';
import { useData } from '../context/DataContext';
import ReportDetail from './ReportDetail';
import XCircleIcon from './icons/XCircleIcon';
import Avatar from './Avatar';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmModal from './ConfirmModal';

interface ReportDetailModalProps {
    report: Report;
    user: User;
    viewerRole: Role;
    onClose: () => void;
    hideMargin?: boolean;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, user, viewerRole, onClose, hideMargin = false }) => {
    const { markReportAsViewed, markCommentAsRead, deleteReport } = useData();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (viewerRole === Role.MANAGER && !report.isViewedByManager) {
            markReportAsViewed(report.id);
        }
        if (viewerRole === Role.EMPLOYEE && report.managerComment && !report.isCommentReadByEmployee) {
            markCommentAsRead(report.id);
        }
    }, [report, viewerRole, markReportAsViewed, markCommentAsRead]);

    const handleDelete = async () => {
        await deleteReport(report.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog" onClick={onClose}>
            <div id="printable-area" className="relative w-full h-full sm:max-w-4xl sm:h-[90vh] sm:rounded-3xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* ترويسة الطباعة الرسمية (تظهر فقط عند الطباعة) */}
                <div className="hidden print:block p-8 border-b-4 border-double border-black mb-6">
                    <div className="flex justify-between items-start">
                        <div className="text-right space-y-1">
                            <h1 className="text-2xl font-bold mb-2">وزارة الثقافة</h1>
                            <h2 className="text-xl font-bold">دائرة الفنون والمسرح</h2>
                            <p className="font-semibold text-lg pt-2">الوحدة: {user.unit || 'غير محدد'}</p>
                            <div className="mt-4 border-r-4 border-brand-dark pr-3 py-1 bg-gray-50">
                                <p className="font-bold text-lg">الاسم: {user.fullName}</p>
                                <p className="font-medium text-sm">العنوان الوظيفي: {user.jobTitle}</p>
                                <p className="font-medium text-sm">الرقم الوظيفي: {user.badgeNumber}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <img src="icon.png" alt="Logo" className="w-20 h-20 mx-auto mb-2" />
                            <p className="text-[10px] text-gray-500">نظام التقارير اليومي</p>
                        </div>
                        <div className="text-left space-y-1">
                             <p className="font-bold text-xl text-brand-dark">تقرير رقم: {report.sequenceNumber}</p>
                             <p className="font-medium">التاريخ: {report.date}</p>
                             <p className="font-medium">اليوم: {report.day}</p>
                        </div>
                    </div>
                </div>

                {/* رأس الشاشة (يختفي عند الطباعة) */}
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 no-print flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center space-x-3 space-x-reverse">
                         <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} />
                         <div>
                            <h3 className="text-lg font-bold text-brand-dark dark:text-gray-100">{user.fullName}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">تقرير {report.date} - #{report.sequenceNumber}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {viewerRole === Role.MANAGER && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="حذف التقرير"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-light text-white rounded-2xl font-bold shadow-lg shadow-brand-light/20 hover:scale-105 transition-all"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>طباعة التقرير</span>
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XCircleIcon className="w-8 h-8"/>
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto no-scrollbar">
                    <ReportDetail report={report} user={user} viewerRole={viewerRole} hideMargin={hideMargin} />
                </div>
            </div>

            {showDeleteConfirm && (
                <ConfirmModal
                    title="حذف التقرير"
                    message="هل أنت متأكد من رغبتك في حذف هذا التقرير نهائياً؟"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="حذف"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default ReportDetailModal;
