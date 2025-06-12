import { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message } from 'antd';
import { useAuth } from '../context/AuthContext';

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const { user } = useAuth();

  const token= localStorage.getItem("token");


  // Use absolute URL in development to avoid routing issues
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : '';

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/bookings/owner-bookings`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // First check if the response is OK
      if (response.status === 401) {
      // Token might be expired - try to refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        return fetchBookings(); // Retry with new token
      }
      throw new Error('Session expired, please login again');
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch bookings');
    }

    setBookings(data.bookings);
  } catch (error) {
    console.error('Fetch error:', error);
    message.error(`Failed to load bookings: ${error.message}`);
    setBookings([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBookings();
  }, [user.token]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({...prev, [bookingId]: true}));
      
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update status');
      }

      message.success('Booking status updated successfully');
      fetchBookings(); // Refresh data
    } catch (error) {
      console.error('Status change error:', error);
      message.error(error.message);
    } finally {
      setUpdatingStatus(prev => ({...prev, [bookingId]: false}));
    }
  };

  const columns = [
    {
      title: 'Ground',
      dataIndex: 'groundName',
      key: 'groundName',
      render: (text, record) => (
        <a href={`/ground/:id`}>{text}</a>
      )
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <>
          <div>{record.date}</div>
          <div>{record.timeSlot}</div>
        </>
      )
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <>
          <div>{record.userName}</div>
          <div>{record.userEmail}</div>
          {record.userPhone && <div>{record.userPhone}</div>}
        </>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'price',
      key: 'price',
      render: price => `₹${price}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        let color = '';
        switch (status) {
          case 'confirmed':
            color = 'green';
            break;
          case 'cancelled':
            color = 'red';
            break;
          case 'completed':
            color = 'blue';
            break;
          default:
            color = 'orange';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'payment',
      render: status => (
        <Tag color={status === 'paid' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'PENDING'}
        </Tag>
      )
    },
    {
      title: 'Booked At',
      dataIndex: 'bookedAt',
      key: 'bookedAt'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'confirmed' && (
            <>
              <Button 
                type="primary" 
                size="small"
                loading={updatingStatus[record._id]}
                onClick={() => handleStatusChange(record._id, 'completed')}
              >
                Mark Completed
              </Button>
              <Button 
                danger 
                size="small"
                loading={updatingStatus[record._id]}
                onClick={() => handleStatusChange(record._id, 'cancelled')}
              >
                Cancel
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="owner-bookings-container">
      <h1>Your Grounds' Bookings</h1>
      <Table
        columns={columns}
        dataSource={bookings}
        loading={loading}
        rowKey="_id"
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} bookings`
        }}
      />
    </div>
  );
};

export default OwnerBookings;