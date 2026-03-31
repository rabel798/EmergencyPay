import React from 'react';
import StablecoinConverter from '@/components/StablecoinConverter';

const StablecoinsPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 p-4 overflow-auto">
      <div className="max-w-4xl mx-auto w-full">
        <StablecoinConverter />
      </div>
    </div>
  );
};

export default StablecoinsPage;
