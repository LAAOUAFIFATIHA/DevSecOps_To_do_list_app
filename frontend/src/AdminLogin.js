import React, { useState } from 'react';
import { loginAdmin } from './api';

const AdminLogin = ({ history }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { data } = await loginAdmin(username, password);
            localStorage.setItem('admin_token', data.access_token);
            history.push('/admin/dashboard');
        } catch (err) {
            setError('Authentication failed. Check security credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5 py-5 animate-fade-in">
            <div className="row justify-content-center">
                <div className="col-md-5 col-lg-4">
                    <div className="text-center mb-5">
                        <span className="fs-1">🔒</span>
                        <h2 className="fw-bold mt-2">Security Authorization</h2>
                        <p className="text-muted">Enter administrative credentials to access the node console.</p>
                    </div>

                    <div className="glass-card p-5 border-0 shadow-xl">
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-uppercase">Admin ID</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg border-2"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-uppercase">Secure Key</label>
                                <input
                                    type="password"
                                    className="form-control form-control-lg border-2"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <div className="alert alert-danger py-2 small border-0 mb-4">{error}</div>}
                            <button type="submit" className="btn btn-primary w-100 btn-lg shadow-lg" disabled={loading}>
                                {loading ? 'Validating...' : 'Authorize Login'}
                            </button>
                        </form>
                    </div>
                    <div className="text-center mt-4">
                        <p className="text-muted small">System Restricted Access - IP Logged</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
