import React from 'react';
import { User } from '../types';
import Avatar from './Avatar';
import FolderIcon from './icons/FolderIcon';

interface EmployeeFolderProps {
    employee: User;
    unreadCount: number;
    onClick: () => void;
}

const EmployeeFolder: React.FC<EmployeeFolderProps> = ({ employee, unreadCount, onClick }) => {
    return (
        <div 
            onClick={onClick} 
            className="relative p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            role="button"
            aria-label={`عرض تقارير ${employee.fullName}`}
        >
            <div className="relative flex flex-col items-center text-center">
                 <div className="absolute -top-2 -right-2 z-10">
                    {unreadCount > 0 && (
                        <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-brand-accent-red rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                
                <div className="relative mb-3">
                     <FolderIcon className="w-24 h-24 text-gray-100 dark:text-gray-700 group-hover:text-yellow-200 dark:group-hover:text-yellow-400/30 transition-colors" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar src={employee.profilePictureUrl} name={employee.fullName} size={56} className="border-2 border-white dark:border-gray-800 shadow-sm"/>
                     </div>
                </div>

                <h4 className="font-semibold text-brand-dark dark:text-gray-100 truncate w-full" title={employee.fullName}>{employee.fullName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full" title={employee.jobTitle}>{employee.jobTitle}</p>
            </div>
        </div>
    );
};

export default EmployeeFolder;