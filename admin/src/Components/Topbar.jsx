import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import "./Topbar.css";

const RAW_API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002/api";
const REACT_APP_API_URL = RAW_API_URL.replace(/['"]/g, '');
const SOCKET_URL = REACT_APP_API_URL.replace(/\/api\/?$/, "");

const Topbar = ({ toggleSidebar, isSidebarCollapsed }) => {
  const [openProfile, setOpenProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = sessionStorage.getItem("admin_notifications");
    return saved ? JSON.parse(saved) : [];
  });
  
  // State for user profile
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const token = localStorage.getItem("token");

  // Fetch user profile from backend
  useEffect(() => {
    if (!token) {
      setLoadingProfile(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${REACT_APP_API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;
        setAdminName(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.name || "Admin");
        setAdminEmail(user.email || "");
        setAdminPhone(user.phone || "");
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        // Fallback to localStorage or default values
        setAdminName(localStorage.getItem("admin_name") || "Admin");
        setAdminEmail(localStorage.getItem("admin_email") || "admin@Jayastra.com");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Socket.io for new order notifications
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("newOrder", (order) => {
      const newNotif = {
        id: order.id,
        customer: order.customer_name,
        amount: order.total_amount,
        time: new Date().toLocaleTimeString(),
        unread: true
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev].slice(0, 10);
        sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
        return updated;
      });

      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setOpenProfile(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_email");
    sessionStorage.removeItem("admin_notifications");
    navigate("/admin/login", { replace: true });
  };

  const markAllRead = (e) => {
    e.stopPropagation();
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    sessionStorage.setItem("admin_notifications", JSON.stringify(updated));
  };

  const clearAllNotifications = (e) => {
    e.stopPropagation();
    setNotifications([]);
    sessionStorage.removeItem("admin_notifications");
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Display name or loading/fallback
  const displayName = loadingProfile ? "Loading..." : (adminName || "Admin");

  return (
    <div className={`admin-topbar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      <div className="topbar-left">
        <button className="toggle-btn" onClick={toggleSidebar}>
          <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-right' : 'bi-list'}`}></i>
        </button>
        <h1 className="page-title">Jayastra</h1>
      </div>

      <div className="topbar-right">
        {/* Notifications Dropdown */}
        <div className="topbar-icon-wrap" ref={notificationRef}>
          <div className="topbar-icon" onClick={() => setShowNotifications(!showNotifications)}>
            <i className="bi bi-bell"></i>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <h6>
                  <i className="bi bi-bell-fill"></i> Notifications
                  {unreadCount > 0 && <span className="unread-count-badge">{unreadCount} new</span>}
                </h6>
                <div className="notif-actions">
                  {notifications.length > 0 && (
                    <>
                      <button onClick={markAllRead} className="mark-read-btn">
                        <i className="bi bi-check2-all"></i> Mark all read
                      </button>
                      <button onClick={clearAllNotifications} className="clear-all-btn">
                        <i className="bi bi-trash"></i> Clear all
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="no-notif">
                    <i className="bi bi-bell-slash"></i>
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`notif-item ${n.unread ? 'unread' : ''}`} 
                      onClick={() => {
                        navigate('/admin/orders');
                        setShowNotifications(false);
                      }}
                    >
                      <div className="notif-dot"></div>
                      <div className="notif-content">
                        <strong>New Order #{n.id}</strong>
                        <p>From: {n.customer} | Amount: ₹{n.amount}</p>
                        <small>{n.time}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="notif-footer" onClick={() => {
                  navigate('/admin/orders');
                  setShowNotifications(false);
                }}>
                  View All Orders <i className="bi bi-arrow-right"></i>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="admin-profile" ref={profileRef}>
          <div className="profile-trigger" onClick={() => setOpenProfile(!openProfile)}>
            <div className="profile-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{adminPhone || "Admin"}</span>
            </div>
            <i className={`bi bi-chevron-down dropdown-icon ${openProfile ? 'rotated' : ''}`}></i>
          </div>

          {openProfile && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">
                  <i className="bi bi-person-circle"></i>
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{adminName || "Admin"}</div>
                  <div className="dropdown-user-email">{adminEmail}</div>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-menu-items">
                <div className="dropdown-item" onClick={() => {
                  navigate('/admin/profile');
                  setOpenProfile(false);
                }}>
                  <i className="bi bi-person"></i>
                  <span>My Profile</span>
                </div>
                
                <div className="dropdown-item" onClick={() => {
                  navigate('/admin/settings');
                  setOpenProfile(false);
                }}>
                  <i className="bi bi-gear"></i>
                  <span>Settings</span>
                </div>
                
                <div className="dropdown-item" onClick={() => {
                  navigate('/admin/orders');
                  setOpenProfile(false);
                }}>
                  <i className="bi bi-box-seam"></i>
                  <span>My Orders</span>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <div className="dropdown-item logout-item" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right"></i>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;