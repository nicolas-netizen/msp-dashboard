import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Clock, 
  Users, 
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import moment from 'moment';

const Dashboard = () => {
  const [stats, setStats] = useState({
    openTickets: 0,
    closedTickets: 0,
    totalHours: 0,
    activeClients: 0,
    period: { startDate: '', endDate: '' }
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [topClientsData, setTopClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchDashboardStats();
    
    // Actualización automática diaria a las 00:00
    const checkForDailyUpdate = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('🔄 Actualización automática diaria - nueva semana detectada');
        fetchDashboardStats();
      }
    };
    
    // Verificar cada hora si es momento de actualizar
    const interval = setInterval(checkForDailyUpdate, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [period]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Usar el sistema automático del backend - no enviar fechas
      const [statsResponse, weeklyResponse, topClientsResponse] = await Promise.all([
        axios.get('/api/dashboard/stats', { params: { period } }),
        axios.get('/api/dashboard/weekly-activity', { params: { period } }),
        axios.get('/api/dashboard/top-clients', { params: { period } })
      ]);
      
      setStats(statsResponse.data);
      setWeeklyData(weeklyResponse.data.weeklyData || []);
      setTopClientsData(topClientsResponse.data.topClientsData || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Tickets Abiertos',
      value: stats.openTickets,
      icon: Ticket,
      color: 'from-red-500 to-pink-600',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Tickets Cerrados',
      value: stats.closedTickets,
      icon: Ticket,
      color: 'from-green-500 to-emerald-600',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Horas Totales',
      value: `${stats.totalHours}h`,
      icon: Clock,
      color: 'from-blue-500 to-indigo-600',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Clientes Activos',
      value: stats.activeClients,
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      change: '+2',
      changeType: 'increase'
    }
  ];

  // Use real data from API instead of static data

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {stats.period?.label || (period === 'week' ? 'Esta Semana' : 'Último Mes')}
          {stats.period?.startDate && stats.period?.endDate && (
            <span className="ml-2 text-sm text-blue-600">
              ({moment(stats.period.startDate).format('DD/MM')} - {moment(stats.period.endDate).format('DD/MM')})
            </span>
          )}
        </p>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-4 mt-4">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Última Semana
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Último Mes
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card bg-gradient-to-r ${stat.color}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className={`text-sm mt-2 ${
                    stat.changeType === 'increase' ? 'text-green-200' : 'text-red-200'
                  }`}>
                    {stat.change} vs período anterior
                  </p>
                </div>
                <Icon className="w-12 h-12 opacity-80" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Activity Chart */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Semanal</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No hay datos de actividad para mostrar
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        {/* Top Clients Table */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Clientes</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          {topClientsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Tickets</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsData.map((client, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {client.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{client.name}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-700">{client.count}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{client.value}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay datos de clientes para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5 mr-2 text-blue-600" />
            Exportar Reporte
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Ticket className="w-5 h-5 mr-2 text-green-600" />
            Nuevo Ticket
          </button>
          <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Registrar Horas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
