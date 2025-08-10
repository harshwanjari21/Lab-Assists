import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Sidebar = () => {
  return (
    <div className="h-screen w-64 bg-gray-50 border-r border-gray-200 fixed left-0 top-0 flex flex-col">
      <div className="p-3">
        <div className="flex justify-center mb-2">
          <img src="/logo.png" alt="LabAssist Logo" className="w-36 h-36 object-contain" />
        </div>
        <div className="border-b border-gray-200 mb-2"></div>
      </div>
      <nav className="flex-1 px-4">
        <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">dashboard</span>
          Dashboard
        </Link>
        <Link to="/patients" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">people</span>
          Patients
        </Link>
        <Link to="/tests" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">science</span>
          Tests
        </Link>
        <Link to="/reports" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">description</span>
          Reports
        </Link>
        <Link to="/analytics" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">analytics</span>
          Analytics
        </Link>
        <Link to="/administration" className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer">
          <span className="material-icons mr-3">business</span>
          Administration
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
