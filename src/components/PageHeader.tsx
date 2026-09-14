'use client';

import { Building2 } from 'lucide-react';
import { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

const PageHeader = ({ title, description, icon }: PageHeaderProps) => {
  return (
    <div className="flex items-center gap-2 px-5 py-2 sm:px-6">
      <div className="mr-2 flex h-14 w-14 items-center justify-center rounded-lg bg-[#f14902]/10">
        {/* <Building2 className="h-8 w-8 text-[#f14902]" /> */}
        {icon}
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#393536] sm:text-[26px]">
          {title}
        </h1>

        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6b6968]">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
