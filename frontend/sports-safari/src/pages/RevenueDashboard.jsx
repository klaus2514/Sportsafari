import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const RevenueDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Debug: Verify user context
        console.log('Fetching as:', { 
          role: user?.role, 
          hasToken: !!user?.token 
        });

        const response = await axios.get('/api/bookings/owner-revenue', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });

        console.log('API Response:', response.data); // Debug response

        if (!response.data.success) {
          throw new Error(response.data.message || 'Authorization failed');
        }

        setData(response.data);
      } catch (err) {
        console.error('Fetch error:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    } else {
      setError('No authentication token found');
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Owner Revenue Dashboard</h1>
      {data && (
        <>
          <div className="stats">
            <div className="stat-card">
              <h3>Total Revenue</h3>
              <p>₹{data.totalRevenue}</p>
            </div>
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <p>{data.totalBookings}</p>
            </div>
          </div>
          
          <div className="chart">
            <h2>Revenue by Ground</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.byGround}
                  dataKey="revenue"
                  nameKey="groundName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.byGround.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default RevenueDashboard;