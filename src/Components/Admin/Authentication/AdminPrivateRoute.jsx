import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from '../../Authentication/AuthProvider';

const PrivateRoute = () => {
  const { isAuthenticated, user } = useAuth();
  const isAdminUser =
    user?.role === 'admin' ||
    user?.isadmin === true ||
    user?.isAdmin === true ||
    user?.isSuperAdmin === true;

  return isAuthenticated && isAdminUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
