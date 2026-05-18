import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import sarry_logo from "../assets/jayastra_banner.png";

import "./AdminLogin.css";

const API_URL = process.env.REACT_APP_API_URL;

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password
      });

      const role = res.data.user.role;
      if (role !== "super_admin" && role !== "admin" && role !== "vendor") {
        toast.error("Access denied. Not an admin or vendor");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userRole", role);
      localStorage.setItem("admin_name", res.data.user.name);

      toast.success("Login successful");
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 1000);

    } catch (err) {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="login-logo-container">
          <img src={sarry_logo} className="sidebar-logo-login" alt="Logo" />
        </div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
          <div style={{ position: 'relative', width: '100%' }}>
            <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '40px', marginBottom: '15px' }} />
            <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '21px', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666', fontSize: '18px' }}></i>
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;