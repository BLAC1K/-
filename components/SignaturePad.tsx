import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onBegin?: () => void;
    onEnd?: () => void;
    onClear?: () => void;
}

export interface SignaturePadRef {
    getSignature: () => string;
    clearSignature: () => void;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ onBegin, onEnd, onClear }, ref) => {
    const sigPadRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
        getSignature: () => {
            if (sigPadRef.current) {
                // Returns a base64 encoded PNG image
                return sigPadRef.current.toDataURL('image/png');
            }
            return '';
        },
        clearSignature: () => {
             if (sigPadRef.current) {
                sigPadRef.current.clear();
                if(onClear) onClear();
            }
        }
    }));
    
    const handleClear = () => {
        if (sigPadRef.current) {
            sigPadRef.current.clear();
            if(onClear) onClear();
        }
    };

    return (
        <div className="mt-4">
            <div className="relative w-full h-48 bg-white border border-gray-300 rounded-md overflow-hidden">
                <SignatureCanvas
                    ref={sigPadRef}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full' }}
                    onBegin={onBegin}
                    onEnd={onEnd}
                />
                 <div className="absolute inset-0 flex items-center justify-center -z-10 text-gray-300 pointer-events-none">
                    <span>وقّع هنا</span>
                </div>
            </div>
            <button
                type="button"
                onClick={handleClear}
                className="mt-2 text-sm text-gray-600 hover:text-brand-dark"
            >
                مسح التوقيع
            </button>
        </div>
    );
});

export default SignaturePad;