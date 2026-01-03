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
            history.push(`/stream/${streamId}`);
        } catch (err) {
            alert('Error submitting task');
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <Link to={`/stream/${streamId}`} className="btn btn-link mb-3 text-dark">← Back to Stream</Link>
                    <div className="card shadow border-0">
                        <div className="card-body p-4">
                            <h2 className="mb-4">Submit New Task</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter your name"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Task Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="What needs to be done?"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 btn-lg shadow-sm" disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit Task'}
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
