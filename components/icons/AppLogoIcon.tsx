import React from 'react';

const AppLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
      style={{ width: '100%', height: '100%', ...props.style }}
      {...props}
    >
      {/* الخلفية الرئيسية - مربع بزوايا منحنية */}
      <rect x="40" y="40" width="432" height="432" rx="40" fill="#085A8C" />
      
      {/* ستارة المسرح العلوية (تجريدية) */}
      <path d="M40 120C40 80 120 60 256 60C392 60 472 80 472 120V160H40V120Z" fill="white" fillOpacity="0.1" />
      <path d="M40 160C100 160 140 100 140 40H372C372 100 412 160 472 160" stroke="white" strokeWidth="12" strokeLinecap="round" />

      {/* أقنعة المسرح - Comedy Mask */}
      <path d="M160 220C160 200 200 190 230 190V250C200 250 160 240 160 220Z" fill="#FBC02D" />
      <circle cx="185" cy="215" r="5" fill="#085A8C" />
      <path d="M180 235Q195 245 210 235" stroke="#085A8C" strokeWidth="3" fill="none" />

      {/* أقنعة المسرح - Tragedy Mask */}
      <path d="M352 220C352 200 312 190 282 190V250C312 250 352 240 352 220Z" fill="white" />
      <circle cx="327" cy="215" r="5" fill="#085A8C" />
      <path d="M310 245Q325 235 340 245" stroke="#085A8C" strokeWidth="3" fill="none" />

      {/* لوحة ألوان الفنون التشكيلية (الباليت) في الأسفل */}
      <path d="M100 400C100 370 150 360 256 360C362 360 412 380 412 410C412 440 330 460 256 460C150 460 100 430 100 400Z" fill="#42A5B3" />
      
      {/* بقع الألوان - تمثل حالات المهام */}
      <circle cx="180" cy="410" r="12" fill="#E54B22" />
      <circle cx="230" cy="415" r="12" fill="#FBC02D" />
      <circle cx="280" cy="410" r="12" fill="#7CB342" />
      <circle cx="330" cy="405" r="12" fill="white" />

      {/* الفرشاة / القلم المائل */}
      <g transform="translate(380, 240) rotate(15)">
        <rect x="0" y="0" width="15" height="180" rx="7.5" fill="white" />
        <rect x="-2" y="150" width="19" height="30" rx="4" fill="#42A5B3" />
        <path d="M0 180C0 195 15 195 15 180V170H0V180Z" fill="#42A5B3" />
      </g>

      {/* إطار خارجي أنيق */}
      <rect x="55" y="55" width="402" height="402" rx="30" stroke="#42A5B3" strokeWidth="6" fill="none" opacity="0.3" />
    </svg>
  );
};

export default AppLogoIcon;