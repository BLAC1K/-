import React from 'react';

interface PercentageCircleProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    className?: string;
}

const PercentageCircle: React.FC<PercentageCircleProps> = ({ percentage, size = 60, strokeWidth = 5, className = '' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPercentage = Math.max(0, Math.min(percentage || 0, 100));
    const offset = circumference - (clampedPercentage / 100) * circumference;

    const getColor = (p: number) => {
        if (p < 50) return 'text-brand-accent-red';
        if (p < 80) return 'text-brand-accent-yellow';
        return 'text-brand-accent-green';
    };

    const colorClass = getColor(clampedPercentage);

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${colorClass} transition-all duration-500 ease-in-out`}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`text-lg font-bold ${colorClass}`} style={{ fontSize: size / 3.5 }}>
                {Math.round(clampedPercentage)}%
            </span>
        </div>
    );
};

export default PercentageCircle;
