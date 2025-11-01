import React from 'react';

interface AvatarProps {
    src?: string;
    name: string;
    size?: number;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40, className = '' }) => {
    const getInitials = (name: string) => {
        if(!name) return '';
        const words = name.split(' ');
        if (words.length > 1 && words[0] && words[1]) {
            return `${words[0][0]}${words[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            {src ? (
                <img
                    src={src}
                    alt={name}
                    className={`rounded-full object-cover ${className}`}
                    style={{ width: size, height: size }}
                />
            ) : (
                <div
                    className={`flex items-center justify-center rounded-full bg-brand-light text-white ${className}`}
                    style={{ width: size, height: size, fontSize: size / 2.5 }}
                >
                    <span className="font-semibold">{getInitials(name)}</span>
                </div>
            )}
        </>
    );
};

export default Avatar;
