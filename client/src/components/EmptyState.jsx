import React from 'react';
import { PackageX } from 'lucide-react';

const EmptyState = ({ icon: Icon = PackageX, title, description, action }) => (
  <div className="empty-state">
    <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-pink-300" />
    </div>
    <h3 className="text-lg font-semibold text-navy-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-5 max-w-xs">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
