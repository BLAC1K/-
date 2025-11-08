import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { SignatureData } from '../types';

interface SignaturePadProps {
    onBegin?: () => void;
    onEnd?: () => void;
    onClear?: () => void;
}

export interface SignaturePadRef {
    getSignatureData: () => SignatureData;
    clearSignature: () => void;
    isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onBegin, onEnd, onClear }, ref) => {
    const sigPadRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
        getSignatureData: () => {
            if (sigPadRef.current) {
                // Returns an array of point groups (biometric data)
                return sigPadRef.current.toData();
            }
            return [];
        },
        clearSignature: () => {
             if (sigPadRef.current) {
                sigPadRef.current.clear();
                if(onClear) onClear();
            }
        },
        isEmpty: () => {
            return sigPadRef.current?.isEmpty() ?? true;
        }
    }));
    
    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
            if(onClear) onClear();
        }
    };

    return (
        <div className="mt-2">
            <div className="relative w-full h-48 bg-white dark:bg-gray-100 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <SignatureCanvas
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full' }}
                    onBegin={onBegin}
                    onEnd={onEnd}
                />
                 <div className="absolute inset-0 flex items-center justify-center -z-10 text-gray-300 dark:text-gray-500 pointer-events-none">
                    <span>وقّع هنا</span>
                </div>
            </div>
            <button
                type="button"
                onClick={handleClear}
                className="mt-2 text-sm text-gray-600 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-200"
            >
                مسح التوقيع
            </button>
        </div>
    );
});

export default SignaturePad;