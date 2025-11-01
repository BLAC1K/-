import React from 'react';

const JobTitleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.05a2.25 2.25 0 01-2.25 2.25h-13.5A2.25 2.25 0 012.25 18.2V14.15M3 9.375l.165.165A1.875 1.875 0 014.5 10.5h15a1.875 1.875 0 011.335-.56l.165-.165m-15 0h15m-1.5-3.375a1.5 1.5 0 01-3 0V4.5a1.5 1.5 0 011.5-1.5h.75a1.5 1.5 0 011.5 1.5v1.5z" />
    </svg>
);

export default JobTitleIcon;