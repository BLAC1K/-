import React from 'react';

const FolderOpenIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75v1.5a3 3 0 003 3h9a3 3 0 003-3v-1.5M3.75 9.75h16.5M3.75 9.75A2.25 2.25 0 016 7.5h12A2.25 2.25 0 0120.25 9.75M3.75 21a2.25 2.25 0 01-2.25-2.25V6.75A2.25 2.25 0 013.75 4.5h16.5A2.25 2.25 0 0122.5 6.75v12A2.25 2.25 0 0120.25 21H3.75z" />
  </svg>
);

export default FolderOpenIcon;
