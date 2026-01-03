import React, { useState, useEffect } from 'react';
import { getAllStreams, createStream } from './api';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = () => {
    const [streams, setStreams] = useState([]);
    const [newStreamName, setNewStreamName] = useState('');

    useEffect(() => {
        fetchStreams();
    }, []);

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
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Admin Management</h2>
                <button onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/'; }} className="btn btn-outline-danger btn-sm">Logout</button>
            </div>

            <div className="card mb-5 border-0 shadow-sm">
                <div className="card-body">
                    <h5 className="card-title">Create New Task Stream</h5>
                    <form onSubmit={handleCreate} className="row g-3">
                        <div className="col-auto">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Stream Name"
                                value={newStreamName}
                                onChange={(e) => setNewStreamName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-auto">
                            <button type="submit" className="btn btn-success">Generate Stream</button>
                        </div>
                    </form>
                </div>
            </div>

            <h4>Existing Streams</h4>
            <div className="row">
                {streams.map(stream => (
                    <div key={stream.stream_id} className="col-md-6 mb-4">
                        <div className="card border-0 shadow hover-card">
                            <div className="card-body d-flex align-items-center">
                                <div className="me-3">
                                    <QRCodeSVG value={`${window.location.origin}/stream/${stream.stream_id}`} size={80} />
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="mb-1">{stream.name}</h5>
                                    <p className="text-muted small mb-2">ID: {stream.stream_id}</p>
                                    <div className="d-flex gap-2">
                                        <Link to={`/stream/${stream.stream_id}`} className="btn btn-primary btn-sm">View Real-time</Link>
                                        <button className="btn btn-light btn-sm" onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/stream/${stream.stream_id}`);
                                            alert('Copied link!');
                                        }}>Copy Link</button>
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
