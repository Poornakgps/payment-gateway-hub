import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, CreditCard, BarChart2, Clock, Settings, LogOut } from 'lucide-react';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-blue-600">
              <CreditCard className="h-8 w-8 mr-2" />
              <span className="font-bold text-xl">Payment Gateway Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link to="/transactions" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Transactions
                </Link>
                <Link to="/reports" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Reports
                </Link>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/sandbox" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Sandbox
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={toggleMenu}
            >
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/transactions"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  Transactions
                </Link>
                <Link
                  to="/reports"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  Reports
                </Link>
                <button
                  onClick={() => {
                    toggleMenu();
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sandbox"
                  className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  Sandbox
                </Link>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;