import React, { useState } from "react";
import axios from "axios";
import "./LoginModal.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useUser } from "../context/UserContext";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

const LoginModal = ({ show, setShow }) => {
  const { fetchCart } = useCart();
  const { fetchWishlist } = useWishlist();
  const { fetchUser } = useUser();

  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: ""
  });

  if (!show) return null;

  /* ================= SIMPLE AUTH (Login/Register) ================= */

  const handleSimpleAuth = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_URL}/auth/simple-login`, {
        phone: formData.phone,
        name: isSignup ? formData.name : undefined
      });

      localStorage.setItem("token", res.data.token);
      fetchCart();
      fetchWishlist();
      fetchUser();
      setShow(false);

    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleSuccess = async (response) => {
    try {
      const decoded = jwtDecode(response.credential);

      const res = await axios.post(`${API_URL}/auth/google-login`, {
        name: decoded.name,
        email: decoded.email,
      });

      localStorage.setItem("token", res.data.token);
      fetchCart();
      fetchWishlist();
      fetchUser();
      setShow(false);

    } catch (err) {
      console.log(err);
      setError("Google login failed");
    }
  };

  return (
    <div className="login-overlay">

      <div className="login-popup">

        <button
          className="close-btn"
          onClick={() => setShow(false)}
        >
          ✕
        </button>

        <h2>{isSignup ? "Create Account" : "Login"}</h2>

        {error && <p className="auth-error">{error}</p>}

        <form onSubmit={handleSimpleAuth} className="auth-form">

          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value
              })}
            />
          )}

          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={formData.phone}
            onChange={(e) => setFormData({
              ...formData,
              phone: e.target.value
            })}
          />

          <button type="submit">
            {isSignup ? "Create Account" : "Login"}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          {/* 🔥 Google Login Button */}
          <div className="google-btn-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
            />
          </div>

          <p className="switch-auth">
            {isSignup ? "Already have account?" : "New user?"}{" "}
            <span onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}>
              {isSignup ? "Login" : "Create account"}
            </span>
          </p>

        </form>

      </div>

    </div>
  );
};

export default LoginModal;
