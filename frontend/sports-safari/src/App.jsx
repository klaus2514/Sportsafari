import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserDashboard from './pages/Dashboard';
import About from './pages/About';
import OwnerDashboard from './pages/OwnerDashboard';
import AddGround from './pages/Add';
import OwnerBookings from './pages/OwnerBookings';
import RevenueDashboard from './pages/RevenueDashboard';
import ViewGrounds from './pages/ViewGrounds';
import SportsSelection from './pages/SportsSelection';  // Import SportSelection
import Grounds from './pages/Grounds';  // Import Grounds
import BookingPage from './pages/BookingPage';
import BookingConfirmation from './pages/BookingConfirmation';
import Confirm from './pages/confirm';

function App() {
  const { isAuthenticated, role } = useAuth();

  // Helper function for owner-only routes
  const ownerRoute = (element) => {
    return isAuthenticated ? (
      role === 'owner' ? (
        element
      ) : (
        <Navigate to="/user-dashboard" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    );
  };

  return (
    <div className="app-container">
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to={role === 'owner' ? '/owner-dashboard' : '/user-dashboard'} replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={role === 'owner' ? '/owner-dashboard' : '/user-dashboard'} replace /> : <Register />} />

       {/* Protected user routes */}
<Route path="/user-dashboard" element={isAuthenticated ? (role === 'user' ? <UserDashboard /> : <Navigate to="/owner-dashboard" replace />) : <Navigate to="/login?redirect=/user-dashboard" replace />} />
<Route path="/my-bookings" element={(<Confirm />)} />
<Route path="/booking-confirmation" element={<BookingConfirmation/>} />

        {/* Owner dashboard and nested routes */}
        <Route path="/owner-dashboard" element={ownerRoute(<OwnerDashboard />)}>
          <Route index element={<Navigate to="bookings" replace />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="revenue" element={<RevenueDashboard />} />
        </Route>

        {/* Standalone owner routes */}
        <Route path="/view-grounds" element={ownerRoute(<ViewGrounds />)} />
        <Route path="/add-ground" element={ownerRoute(<AddGround />)} />
        <Route path="/owner-bookings" element={ownerRoute(<OwnerBookings />)} />
        <Route path="/revenue-dashboard" element={ownerRoute(<RevenueDashboard />)} />

        {/* Common routes */}
        <Route path="/about" element={<About />} />
        <Route path="/home" element={isAuthenticated ? <Navigate to={role === 'owner' ? '/owner-dashboard' : '/user-dashboard'} replace /> : <Home />} />

        {/* New Sport Selection route */}
        <Route path="/select-sport" element={<SportsSelection />} />

        {/* Grounds route based on sport */}
        <Route path="/grounds/:sport" element={<Grounds />} />
        <Route path="/bookings/book" element={<BookingPage />} />
        <Route path="/book/:sport/:groundId" element={<BookingPage />} />
        {/* Root route */}
        <Route path="/" element={isAuthenticated ? <Navigate to={role === 'owner' ? '/owner-dashboard' : '/user-dashboard'} replace /> : <Navigate to="/home" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
