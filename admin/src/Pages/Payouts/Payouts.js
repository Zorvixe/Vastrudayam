// Payouts.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Payouts.css";

const API_URL = process.env.REACT_APP_API_URL;

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [summary, setSummary] = useState({ total_pending: 0, total_paid: 0, total_requested: 0 });
  const [vendorTotals, setVendorTotals] = useState({ total_pending: 0, total_paid: 0, total_requested: 0 });
  const [selectedVendor, setSelectedVendor] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [vendorBalances, setVendorBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("all"); // "all", "pending", "paid"

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  // Fetch all payouts and build vendor list
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayouts(res.data.payouts || []);
      setBalance(res.data.balance || 0);

      if (userRole === "super_admin" && res.data.payouts) {
        const vendorMap = new Map();
        res.data.payouts.forEach(p => {
          const vendorId = p.vendor_id;
          const vendorName = p.store_name || p.email || `Vendor ${vendorId}`;
          if (!vendorMap.has(vendorId)) {
            vendorMap.set(vendorId, { id: vendorId, name: vendorName });
          }
        });
        setVendors(Array.from(vendorMap.values()));
      }
    } catch (err) {
      toast.error("Failed to load payout data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (userRole !== "super_admin") return;
    try {
      const res = await axios.get(`${API_URL}/admin/payouts/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  const fetchVendorTotals = async (vendorId) => {
    if (!vendorId) return;
    setLoadingVendor(true);
    try {
      const res = await axios.get(`${API_URL}/admin/payouts/vendor-summary/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setVendorTotals(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch vendor totals", err);
    } finally {
      setLoadingVendor(false);
    }
  };

  const fetchVendorBalances = async () => {
    if (userRole !== "super_admin") return;
    setLoadingBalances(true);
    try {
      const res = await axios.get(`${API_URL}/admin/vendor-balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setVendorBalances(res.data.vendors);
      }
    } catch (err) {
      console.error("Failed to fetch vendor balances", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSummary();
    fetchVendorBalances();
  }, []);

  useEffect(() => {
    if (userRole === "super_admin" && selectedVendor) {
      fetchVendorTotals(selectedVendor);
    } else {
      setVendorTotals({ total_pending: 0, total_paid: 0, total_requested: 0 });
    }
  }, [selectedVendor]);

  // Filter payouts by vendor first, then by status
  let vendorFilteredPayouts = selectedVendor
    ? payouts.filter(p => p.vendor_id === parseInt(selectedVendor))
    : payouts;

  let filteredPayouts = vendorFilteredPayouts;
  if (payoutStatusFilter !== "all") {
    filteredPayouts = vendorFilteredPayouts.filter(p => p.status.toLowerCase() === payoutStatusFilter);
  }

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (amount > balance) return toast.error("Insufficient balance");
    if (amount <= 0) return toast.error("Enter a valid amount");

    try {
      setRequesting(true);
      await axios.post(`${API_URL}/admin/payouts/request`, { amount, bank_details: bankDetails }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Payout requested successfully");
      setAmount("");
      setBankDetails("");
      fetchData();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Mark this payout as Paid?")) return;
    try {
      await axios.put(`${API_URL}/admin/payouts/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Payout Approved");
      fetchData();
      fetchSummary();
    } catch (err) {
      toast.error("Failed to approve");
    }
  };

  const currentSummary = selectedVendor ? vendorTotals : summary;

  const selectedVendorBalance = selectedVendor
    ? vendorBalances.find(v => v.id === parseInt(selectedVendor))?.balance || 0
    : 0;

  const totalAllVendorsBalance = vendorBalances.reduce((sum, v) => sum + parseFloat(v.balance || 0), 0);

  const displayBalanceCard = selectedVendor
    ? { title: `Vendor Wallet Balance: ${vendors.find(v => v.id == selectedVendor)?.name || ""}`, amount: selectedVendorBalance }
    : { title: "Total Wallet Balance (All Vendors)", amount: totalAllVendorsBalance };

  return (
    <div className="payouts-container">
      {loading && (
        <div className="dash-loader-overlay">
          <div className="dash-loader-container">
            <div className="dash-spinner"></div>
          </div>
        </div>
      )}

      <div className="header-box">
        <div>
          <h2>Wallet & Payouts</h2>
          <p>Manage your earnings and withdrawal requests.</p>
        </div>

        <div>
          {/* Vendor Filter (Super Admin only) */}
          {userRole === "super_admin" && vendors.length > 0 && (
            <div className="vendor-filter">
              <label>Filter by Vendor:</label>
              <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                <option value="">All Vendors</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              {selectedVendor && (
                <button className="clear-filter" onClick={() => setSelectedVendor("")}>
                  Clear Filter
                </button>
              )}
              {loadingVendor && <span className="filter-spinner"><div className="inline-spinner"></div></span>}
            </div>
          )}
        </div>
      </div>

      {/* Super Admin: Single Wallet Balance Card */}
      {userRole === "super_admin" && (
        <div className="summary-cards">
          <div className="summary-card balance-card">
            <div className="card-icon"><i className="bi bi-wallet2"></i></div>
            <div className="card-details">
              <span className="label">{displayBalanceCard.title}</span>
              <span className="value">₹{parseFloat(displayBalanceCard.amount).toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon"><i className="bi bi-calculator-fill"></i></div>
            <div className="card-details">
              <span className="label">Total Requested</span>
              <span className="value">₹{parseFloat(currentSummary.total_requested).toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-card pending">
            <div className="card-icon"><i className="bi bi-clock-history"></i></div>
            <div className="card-details">
              <span className="label">Pending Payouts</span>
              <span className="value">₹{parseFloat(currentSummary.total_pending).toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-card paid">
            <div className="card-icon"><i className="bi bi-check-circle-fill"></i></div>
            <div className="card-details">
              <span className="label">Paid Payouts</span>
              <span className="value">₹{parseFloat(currentSummary.total_paid).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Vendor/Admin Wallet Section (existing) */}
      {(userRole === "vendor" || userRole === "admin") && (
        <div className="wallet-card">
          <div className="balance-info">
            <h3>Available Balance</h3>
            <h1>₹{parseFloat(balance).toLocaleString()}</h1>
          </div>
          <form className="payout-form" onSubmit={handleRequestPayout}>
            <h4>Request Withdrawal</h4>
            <input
              type="number"
              placeholder="Amount to withdraw"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              max={balance}
            />
            <textarea
              placeholder="Bank Account Details / UPI ID / Acc No and IFSC"
              value={bankDetails}
              onChange={e => setBankDetails(e.target.value)}
              required
            ></textarea>
            <button type="submit" disabled={requesting || balance <= 0}>
              {requesting ? (
                <>
                  <span className="btn-spinner"></span> Requesting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </form>
        </div>
      )}



      {/* Payout History Table with Status Filter */}
      <div className="table-box">
        <div className="payout-table-header">
          <h4>Payout History {selectedVendor && `- ${vendors.find(v => v.id == selectedVendor)?.name}`}</h4>
          <div className="status-filter">
            <label>Status:</label>
            <select value={payoutStatusFilter} onChange={(e) => setPayoutStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
        <table className="payouts-table">
          <thead>
            <tr>
              <th>ID</th>
              {userRole === "super_admin" && <th>Vendor</th>}
              <th>Amount</th>
              <th>Bank Details</th>
              <th>Status</th>
              <th>Date</th>
              {userRole === "super_admin" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                  No payout records found.
                </td>
              </tr>
            ) : (
              filteredPayouts.map(p => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  {userRole === "super_admin" && <td>{p.store_name || p.email}</td>}
                  <td style={{ fontWeight: 'bold' }}>₹{p.amount}</td>
                  <td>{p.bank_details}</td>
                  <td>
                    <span className={`status-badge ${p.status.toLowerCase()}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{new Date(p.requested_at).toLocaleDateString()}</td>
                  {userRole === "super_admin" && (
                    <td>
                      {p.status === 'Pending' ? (
                        <button className="approve-btn" onClick={() => handleApprove(p.id)}>
                          Approve
                        </button>
                      ) : (
                        <span className="paid-text">
                          <i className="bi bi-check-circle-fill"></i> Paid
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payouts;