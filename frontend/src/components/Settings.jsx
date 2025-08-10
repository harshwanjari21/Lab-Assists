import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const SettingsDropdown = () => {
  const { signOut, user, auth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-md focus:outline-none border-2 border-blue-400 hover:bg-gray-100 transition-colors z-50 flex items-center"
      >
        <img 
          src={user?.photoURL || "/logo.png"} 
          alt="Profile" 
          className="w-10 h-10 rounded-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="fixed top-16 right-4 w-64 bg-white rounded-lg shadow-lg z-50 transform transition-all duration-200 ease-in-out">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={user?.photoURL || "/logo.png"}
                alt="User"
                className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
              />
              <div>
                <p className="font-semibold text-gray-800">{user?.username || "LabAssist"}</p>
                <p className="text-sm text-gray-500">{user?.email || auth?.email || "user@example.com"}</p>
              </div>
            </div>
          </div>
          <ul className="py-2">
            <li>
              <Link
                to="/profile"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Details
              </Link>
            </li>
            <li>
              <Link
                to="/security"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security Settings
              </Link>
            </li>
            <li className="border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SettingsDropdown;