import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import GiveawayDetails from '../pages/GiveawayDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Winners from '../pages/Winners';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/giveaway/:id" element={<GiveawayDetails />} />
      <Route path="/giveaway" element={<GiveawayDetails />} />
      <Route path="/winners" element={<Winners />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;
