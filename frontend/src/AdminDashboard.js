import React, { useState, useEffect } from 'react';
import { getAllStreams, createStream, getConfig } from './api';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = () => {
    const [streams, setStreams] = useState([]);
    const [newStreamName, setNewStreamName] = useState('');
    const [frontendUrl, setFrontendUrl] = useState('');

    useEffect(() => {
        fetchStreams();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await getConfig();
            setFrontendUrl(data.frontend_url);
        } catch (err) {
            console.error("Error fetching config", err);
        }
    };

    const fetchStreams = async () => {
        try {
            const { data } = await getAllStreams();
            setStreams(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createStream(newStreamName);
            setNewStreamName('');
            fetchStreams();
        } catch (err) {
            alert('Error creating stream');
        }
    };

    return (
        <div className="container py-5 animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-extrabold mb-0">Management Center</h1>
                    <p className="text-secondary">Control and monitor your task streams</p>
                </div>
                <button onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/'; }} className="btn btn-outline-danger px-4 rounded-pill">Logout</button>
            </div>

            <div className="glass-card p-4 mb-5 shadow-sm border-0">
                <h4 className="fw-bold mb-4">Initialize New Stream</h4>
                <form onSubmit={handleCreate} className="row g-3">
                    <div className="col-md-6">
                        <input
                            type="text"
                            className="form-control form-control-lg border-2"
                            placeholder="Enter business unit or stream name..."
                            value={newStreamName}
                            onChange={(e) => setNewStreamName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <button type="submit" className="btn btn-primary btn-lg shadow">Generate System Stream</button>
                    </div>
                </form>
            </div>

            <h3 className="fw-bold mb-4">Live Infrastructure Streams</h3>
            <div className="row g-4">
                {streams.map(stream => (
                    <div key={stream.stream_id} className="col-md-6">
                        <div className="glass-card hover-card">
                            <div className="card-body p-4 d-flex">
                                <div className="me-4 qr-container">
                                    <QRCodeSVG
                                        value={`${frontendUrl || window.location.origin}/stream/${stream.stream_id}`}
                                        size={120}
                                        level="H"
                                        includeMargin={true}
                                    />
                                    <div className="text-center mt-2 small text-uppercase fw-bold text-muted" style={{ fontSize: '9px' }}>Public Stream Access</div>
                                </div>
                                <div className="flex-grow-1">
                                    <div className="badge bg-primary-soft text-primary mb-2">ACTIVE NODE</div>
                                    <h4 className="fw-bold mb-1">{stream.name}</h4>
                                    <p className="text-secondary small mb-3">Node ID: {stream.stream_id}</p>

                                    <div className="d-grid gap-2">
                                        <Link to={`/admin/stream/${stream.stream_id}`} className="btn btn-dark btn-sm rounded-3">
                                            Manage Infrastructure
                                        </Link>
                                        <div className="d-flex gap-2">
                                            <Link to={`/stream/${stream.stream_id}`} className="btn btn-outline-secondary btn-sm flex-grow-1">Preview</Link>
                                            <button className="btn btn-light btn-sm border" onClick={() => {
                                                navigator.clipboard.writeText(`${frontendUrl || window.location.origin}/stream/${stream.stream_id}`);
                                                alert('Public Access Link Copied');
                                            }}>🔗</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
