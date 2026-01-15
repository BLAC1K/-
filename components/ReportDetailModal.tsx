
import React, { useEffect, useState } from 'react';
import { Report, User, Role, Attachment } from '../types';
import { useData } from '../context/DataContext';
import ReportDetail from './ReportDetail';
import XCircleIcon from './icons/XCircleIcon';
import Avatar from './Avatar';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmModal from './ConfirmModal';
import * as api from '../services/apiService';

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
    const [fullReport, setFullReport] = useState<Report>(report);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

    useEffect(() => {
        // تحديث حالة القراءة
        if (viewerRole === Role.MANAGER && !report.isViewedByManager) {
            markReportAsViewed(report.id);
        }
        if (viewerRole === Role.EMPLOYEE && report.managerComment && !report.isCommentReadByEmployee) {
            markCommentAsRead(report.id);
        }

        // تحسين الأداء: جلب المرفقات فقط الآن عند الحاجة
        const loadAttachments = async () => {
            if (!report.attachments || report.attachments.length === 0) {
                setIsLoadingAttachments(true);
                try {
                    const attachments = await api.fetchReportAttachments(report.id);
                    setFullReport(prev => ({ ...prev, attachments }));
                } catch (e) {
                    console.error("Failed to load attachments", e);
                } finally {
                    setIsLoadingAttachments(false);
                }
            }
        };

        loadAttachments();
    }, [report.id, viewerRole, markReportAsViewed, markCommentAsRead]);

    const handleDelete = async () => {
        await deleteReport(report.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 md:p-8" aria-modal="true" role="dialog" onClick={onClose}>
            <div id="printable-area" className="relative w-full h-full max-w-5xl sm:h-[95vh] sm:rounded-[2.5rem] bg-white dark:bg-gray-800 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* رأس الشاشة الرقمي */}
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 no-print flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center space-x-3 space-x-reverse">
                         <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} />
                         <div>
                            <h3 className="text-base md:text-lg font-bold text-brand-dark dark:text-gray-100 leading-tight">{user.fullName}</h3>
                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">تقرير {report.date} - #{report.sequenceNumber}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLoadingAttachments && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-brand-light/10 text-brand-light rounded-full text-[10px] font-bold animate-pulse">
                                جاري تحميل المرفقات...
                            </div>
                        )}
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

                <div className="flex-grow overflow-y-auto no-scrollbar bg-white dark:bg-gray-900">
                    <ReportDetail report={fullReport} user={user} viewerRole={viewerRole} hideMargin={hideMargin} />
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
