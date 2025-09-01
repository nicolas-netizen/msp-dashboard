import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Ticket, 
  Clock, 
  FileText, 
  BarChart3,

  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', color: 'text-blue-600' },
    { path: '/tickets/closed', icon: Ticket, label: 'Tickets Cerrados', color: 'text-red-600' },
    { path: '/hours', icon: Clock, label: 'Resumen Horas', color: 'text-purple-600' },
    { path: '/overtime', icon: BarChart3, label: 'Horas Extras', color: 'text-indigo-600' },
    { path: '/reports', icon: FileText, label: 'Reportes Cliente', color: 'text-orange-600' },

  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/CS_Logo_Full_color.png" 
            alt="MSP Dashboard Logo" 
            className="h-12 w-auto"
          />
        </div>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? item.color : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-6">
        <div className="flex items-center text-sm text-gray-500">
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </div>
      </div>
    </div>
  );
};

export default Sidebar;



