
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 md:p-8 no-print" aria-modal="true" role="dialog" onClick={onClose}>
            {/* الحاوية مكبرة للأجهزة اللوحية والكمبيوتر لضمان عدم التداخل */}
            <div id="printable-area" className="relative w-full h-full max-w-5xl sm:h-[95vh] sm:rounded-[2.5rem] bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden print:!h-auto print:!overflow-visible print:!block" onClick={e => e.stopPropagation()}>
                
                {/* ترويسة الطباعة الرسمية - بدون لوجو وبأحجام صغيرة */}
                <div className="hidden print:block p-8 border-b border-black mb-4">
                    <div className="flex justify-between items-start">
                        <div className="text-right space-y-0.5">
                            <h1 className="text-sm font-bold">قسم التنمية والتأهيل الاجتماعي للشباب</h1>
                            <h2 className="text-xs font-bold text-gray-700">شعبة الفنون والمسرح</h2>
                            <div className="pt-2 mt-2 border-r border-gray-400 pr-2">
                                <p className="text-[10px] font-bold">الاسم: <span className="font-medium">{user.fullName}</span></p>
                                <p className="text-[9px]">العنوان الوظيفي: {user.jobTitle}</p>
                                <p className="text-[9px]">الرقم الوظيفي: {user.badgeNumber}</p>
                                <p className="text-[9px]">الوحدة: {user.unit || '---'}</p>
                            </div>
                        </div>
                        <div className="text-left space-y-0.5">
                             <p className="font-bold text-xs text-brand-dark">تقرير تسلسلي: {report.sequenceNumber}</p>
                             <p className="text-[9px]">التاريخ: {report.date}</p>
                             <p className="text-[9px]">اليوم: {report.day}</p>
                        </div>
                    </div>
                </div>

                {/* رأس الشاشة الرقمي - يختفي عند الطباعة */}
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 no-print flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center space-x-3 space-x-reverse">
                         <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} />
                         <div>
                            <h3 className="text-base md:text-lg font-bold text-brand-dark dark:text-gray-100 leading-tight">{user.fullName}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">تقرير {report.date} - #{report.sequenceNumber}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {viewerRole === Role.MANAGER && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-light text-white rounded-xl font-bold shadow-md hover:scale-105 transition-all text-xs md:text-sm"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>طباعة التقرير</span>
                        </button>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <XCircleIcon className="w-8 h-8"/>
                        </button>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 print:!overflow-visible print:!h-auto print:!block">
                    <ReportDetail report={report} user={user} viewerRole={viewerRole} hideMargin={hideMargin} />
                </div>
            </div>

            {showDeleteConfirm && (
                <ConfirmModal
                    title="حذف نهائي"
                    message="هل أنت متأكد من حذف هذا التقرير؟"
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    confirmText="حذف"
                    confirmButtonClass="bg-red-600"
                />
            )}
        </div>
    );
};

export default ReportDetailModal;
