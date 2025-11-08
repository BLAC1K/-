import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { SignatureData } from '../types';

interface SignaturePreviewProps {
    data?: SignatureData;
    className?: string;
}

const SignaturePreview: React.FC<SignaturePreviewProps> = ({ data, className }) => {
    const sigPadRef = useRef<SignatureCanvas>(null);

    useEffect(() => {
        const canvas = sigPadRef.current;
        if (canvas) {
            canvas.clear();
            if (data && data.length > 0) {
                canvas.fromData(data);
                // Disable further drawing
                canvas.off();
            }
        }
    }, [data]);

    return (
        <div className={`relative bg-white border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden ${className}`}>
            <SignatureCanvas
                ref={sigPadRef}
                penColor="black"
                canvasProps={{ className: 'w-full h-full bg-white' }}
            />
            {(!data || data.length === 0) && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                    <span>لا يوجد توقيع</span>
                </div>
            )}
        </div>
    );
};

export default SignaturePreview;