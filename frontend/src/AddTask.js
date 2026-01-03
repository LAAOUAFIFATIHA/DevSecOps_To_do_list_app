import React, { useState } from 'react';
import { addTask } from './api';
import { Link } from 'react-router-dom';

const AddTask = ({ match, history }) => {
    const streamId = match.params.streamId;
    const [userName, setUserName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addTask(streamId, userName, description);
            // After adding, we go back to the public stream view
            history.push(`/stream/${streamId}`);
        } catch (err) {
            alert('Service error: Could not submit task. Please check server status.');
            setLoading(false);
        }
    };

    return (
        <div className="container py-5 animate-fade-in">
            <div className="row justify-content-center">
                <div className="col-md-7">
                    <Link to={`/stream/${streamId}`} className="btn btn-link mb-4 text-secondary text-decoration-none">
                        <span className="me-2">←</span> Return to Interaction Stream
                    </Link>

                    <div className="glass-card shadow-xl overflow-hidden">
                        <div className="bg-primary p-4 text-white">
                            <h2 className="mb-0 fw-bold">Submit Engagement Node</h2>
                            <p className="opacity-75 mb-0">Your proposal will be broadcasted to all stakeholders in real-time.</p>
                        </div>
                        <div className="card-body p-5">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="form-label fw-bold text-uppercase small tracking-wider">Stakeholder Identity</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg border-2"
                                        placeholder="Full Name / Alias"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label fw-bold text-uppercase small tracking-wider">Task Specification</label>
                                    <textarea
                                        className="form-control form-control-lg border-2"
                                        rows="5"
                                        placeholder="Describe the objective, requirement or feedback..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 btn-lg py-3 shadow-lg" disabled={loading}>
                                    {loading ? (
                                        <><span className="spinner-border spinner-border-sm me-2"></span> Transmitting...</>
                                    ) : (
                                        'Broadcast Task'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTask;
