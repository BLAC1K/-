import React, { useState, useMemo } from 'react';
import { User } from '../types';
import EmployeeFolder from './EmployeeFolder';
import FolderOpenIcon from './icons/FolderOpenIcon';
import FolderIcon from './icons/FolderIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface UnitFolderProps {
    unitName: string;
    employees: User[];
    getUnreadCount: (employeeId: string) => number;
    onEmployeeClick: (employee: User) => void;
}

const UnitFolder: React.FC<UnitFolderProps> = ({ unitName, employees, getUnreadCount, onEmployeeClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    const totalUnreadInUnit = useMemo(() => {
        return employees.reduce((acc, employee) => acc + getUnreadCount(employee.id), 0);
    }, [employees, getUnreadCount]);

    return (
        <section aria-labelledby={`unit-header-${unitName.replace(/\s/g, '-')}`} className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <header 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center cursor-pointer"
                role="button"
                aria-expanded={isOpen}
                aria-controls={`unit-content-${unitName.replace(/\s/g, '-')}`}
            >
                {isOpen ? <FolderOpenIcon className="w-8 h-8 text-brand-light" /> : <FolderIcon className="w-8 h-8 text-brand-light" />}
                
                <h2 id={`unit-header-${unitName.replace(/\s/g, '-')}`} className="mr-3 text-2xl font-bold text-brand-dark dark:text-gray-100">
                    {unitName}
                </h2>
                
                <span className="mr-4 px-2 py-1 text-sm font-semibold text-gray-600 bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                    {employees.length} منتسبين
                </span>

                {!isOpen && totalUnreadInUnit > 0 && (
                     <span className="flex items-center justify-center w-6 h-6 mr-3 text-xs font-bold text-white bg-brand-accent-red rounded-full animate-pulse">
                        {totalUnreadInUnit}
                    </span>
                )}

                <div className="mr-auto flex items-center">
                    {isOpen ? <ChevronDownIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /> : <ChevronLeftIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />}
                </div>
            </header>
            
            {isOpen && (
                 <div 
                    id={`unit-content-${unitName.replace(/\s/g, '-')}`}
                    className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in-right"
                >
                    {employees.map(employee => (
                        <EmployeeFolder
                            key={employee.id}
                            employee={employee}
                            unreadCount={getUnreadCount(employee.id)}
                            onClick={() => onEmployeeClick(employee)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default UnitFolder;
