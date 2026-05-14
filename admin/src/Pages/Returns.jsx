import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./Returns.css";

const API_URL = process.env.REACT_APP_API_URL;

const Returns = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminComment, setAdminComment] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const token = localStorage.getItem("token");

    const fetchReturns = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/admin/returns`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReturns(res.data.returns || []);
        } catch (err) {
            toast.error("Failed to fetch returns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        if (!adminComment) return toast.warn("Please provide an admin comment/remark");

        setIsUpdating(true);
        try {
            await axios.put(`${API_URL}/admin/returns/${id}/status`,
                { status, admin_comment: adminComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Return request ${status.toLowerCase()} successfully`);
            setAdminComment("");
            setSelectedRequest(null);
            fetchReturns();
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return
    <div className="dash-loader-overlay">
        <div className="dash-loader-container">
            <div className="dash-spinner"></div>
        </div>
    </div>;

    return (
        <div className="return-modern">
            <div className="return-header">
                <div className="return-header-content">
                    <h1>Return Verification</h1>
                    <p>Review customer unboxing videos and manage return requests</p>
                </div>
                <div className="return-stats">
                    <div className="return-stat-card">
                        <span className="return-stat-value">{returns.length}</span>
                        <span className="return-stat-label">Total Requests</span>
                    </div>
                    <div className="return-stat-card">
                        <span className="return-stat-value">{returns.filter(r => r.status === 'Pending').length}</span>
                        <span className="return-stat-label">Pending</span>
                    </div>
                </div>
            </div>

            <div className="return-workspace">
                {/* Requests Table */}
                <div className="return-requests-section">
                    <div className="return-section-title">
                        <i className="bi bi-inbox"></i> Return Requests
                    </div>
                    <div className="return-table-wrapper">
                        <table className="return-modern-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.length === 0 ? (
                                    <tr><td colSpan="6" className="return-empty">No return requests found</td></tr>
                                ) : (
                                    returns.map(r => (
                                        <tr key={r.id} className={`return-row ${selectedRequest?.id === r.id ? 'active' : ''}`}>
                                            <td data-label="Order ID">#{r.order_id}</td>
                                            <td data-label="Customer">
                                                <strong>{r.user_name}</strong>
                                                <small>{r.phone}</small>
                                            </td>
                                            <td data-label="Reason">{r.reason || '—'}</td>
                                            <td data-label="Status">
                                                <span className={`return-badge return-badge-${r.status.toLowerCase()}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td data-label="Date">{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td data-label="Action">
                                                <button
                                                    className={`return-review-btn ${selectedRequest?.id === r.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedRequest(r)}
                                                >
                                                    {selectedRequest?.id === r.id ? 'Reviewing' : 'Review Video'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Verification Panel - only shows when a request is selected */}
                {selectedRequest && (
                    <div className="return-verification-panel">
                        <div className="return-panel-header">
                            <div>
                                <h3>Verification Panel</h3>
                                <p>Order #{selectedRequest.order_id}</p>
                            </div>
                            <button className="return-panel-close" onClick={() => setSelectedRequest(null)}>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="return-video-card">
                            <div className="return-video-label">
                                <i className="bi bi-camera-reels"></i> Unboxing Evidence
                            </div>
                            <video
                                src={`${API_URL.replace("/api", "")}${selectedRequest.video_url}`}
                                controls
                                className="return-video"
                            />
                        </div>

                        <div className="return-remark-card">
                            <label>Admin Decision Remarks</label>
                            <textarea
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                placeholder="Explain why you approve or reject this return..."
                            />
                        </div>

                        <div className="return-action-buttons">
                            <button
                                className="return-action reject"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(selectedRequest.id, 'Rejected')}
                            >
                                <i className="bi bi-x-circle"></i> Reject Return
                            </button>
                            <button
                                className="return-action approve"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved')}
                            >
                                <i className="bi bi-check-circle"></i> Approve Return
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Returns;