import React from 'react';
import { useTheme } from '../context/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-3 text-md transition-colors rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={`تفعيل الوضع ${theme === 'light' ? 'الليلي' : 'الفاتح'}`}
        >
            <div className="flex items-center">
                 {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                 <span className="mr-3">
                    {theme === 'light' ? 'الوضع الليلي' : 'الوضع الفاتح'}
                </span>
            </div>
             <div className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-gray-200 dark:bg-gray-600">
                <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </div>
        </button>
    );
};

export default ThemeToggle;