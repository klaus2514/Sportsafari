import { useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import '../styles/owner-dashboard.css';
import ViewGrounds from './ViewGrounds'; // Import the ViewGrounds component
import OwnerBookings from './OwnerBookings';
import RevenueDashboard from './RevenueDashboard';
import AddGround from './Add'; // Import the AddGround component

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="owner-dashboard">
      {/* Main Content */}
      <div className="dashboard-container">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-card">
            <h2>Welcome back, {user?.name}</h2>
            <p>Here's what's happening with your facilities today</p>

          </div>
        </section>

        {/* Management Cards */}
        <section className="management-section">
          <h2 className="section-title">Facility Management</h2>
          <div className="management-grid">
            <div className="management-card">
              <div className="card-icon">🏟️</div>
              <h3>My Grounds</h3>
              <p>View and manage all your sports facilities</p>
              <button 
                className="card-button" 
                onClick={() => handleNavigate("/view-grounds")}
              >
                View
              </button>
            </div>
            <div className="management-card">
              <div className="card-icon">📅</div>
              <h3>Bookings</h3>
              <p>View upcoming and past bookings</p>
              <button 
                className="card-button" 
                onClick={() => handleNavigate("/owner-bookings")}
              >
                View
              </button>
            </div>
          
            <div className="management-card">
              <div className="card-icon">➕</div>
              <h3>Add New</h3>
              <p>Create a new sports facility listing</p>
              <button 
                className="card-button" 
                onClick={() => handleNavigate("/add-ground")}
              >
                Create
              </button>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        
      </div>
    </div>
  );
};

export default OwnerDashboard;