import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TicketsOpen from './components/TicketsOpen';
import TicketsClosed from './components/TicketsClosed';
import HoursSummary from './components/HoursSummary';
import ClientReport from './components/ClientReport';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets/open" element={<TicketsOpen />} />
            <Route path="/tickets/closed" element={<TicketsClosed />} />
            <Route path="/hours" element={<HoursSummary />} />
            <Route path="/reports" element={<ClientReport />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

