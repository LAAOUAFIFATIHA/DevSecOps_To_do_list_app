import React, { useState, useEffect } from 'react';
import { getStreamDetails, voteTask, deleteTask, updateTaskStatus } from './api';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const StreamPage = ({ match }) => {
    const streamId = match.params.streamId;
    const [stream, setStream] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setIsAdmin(!!localStorage.getItem('admin_token'));
        loadData();

        // Socket.io Setup
        const socket = io({ path: '/socket.io' }); // Use the window location by default

        socket.emit('join', { room: streamId });

        socket.on('new_task', (task) => {
            setTasks(prev => [task, ...prev]);
        });

        socket.on('task_updated', (updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
        });

        socket.on('task_deleted', ({ task_id }) => {
            setTasks(prev => prev.filter(t => t._id !== task_id));
        });

        return () => socket.disconnect();
    }, [streamId]);

    const loadData = async () => {
        try {
            const { data } = await getStreamDetails(streamId);
            setStream(data.stream);
            setTasks(data.tasks);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVote = async (id) => {
        try {
            await voteTask(id);
        } catch (err) {
            console.error(err);
        }
    };

    // Admin Actions
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this task?')) return;
        try { await deleteTask(id); } catch (err) { console.error(err); }
    };

    const handleStatusChange = async (id, status) => {
        try { await updateTaskStatus(id, status); } catch (err) { console.error(err); }
    };

    if (!stream) return <div className="p-5 text-center">Loading Stream...</div>;

    return (
        <div className="container py-4">
            <div className="card shadow-sm border-0 mb-4 bg-primary text-white">
                <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="h3 mb-1">{stream.name}</h1>
                        <p className="mb-0 opacity-75">Real-time collaboration stream</p>
                    </div>
                    <Link to={`/stream/${streamId}/add`} className="btn btn-warning btn-lg shadow">Add New Task</Link>
                </div>
            </div>

            <div className="row">
                {tasks.map(task => (
                    <div key={task._id} className="col-12 mb-3">
                        <div className={`card border-0 shadow-sm ${task.status === 'refused' ? 'opacity-50' : ''}`}>
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="d-flex align-items-center mb-1">
                                        <span className="badge bg-secondary me-2">{task.user_name}</span>
                                        {task.status === 'accepted' && <span className="badge bg-success">Accepted</span>}
                                        {task.status === 'refused' && <span className="badge bg-danger">Refused</span>}
                                    </div>
                                    <h5 className="mb-0">{task.description}</h5>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    <div className="text-center">
                                        <h4 className="mb-0">{task.votes}</h4>
                                        <button className="btn btn-outline-primary btn-sm mt-1" onClick={() => handleVote(task._id)}>
                                            👍 Vote
                                        </button>
                                    </div>

                                    {isAdmin && (
                                        <div className="border-start ps-3 d-flex gap-1">
                                            <button onClick={() => handleStatusChange(task._id, 'accepted')} className="btn btn-success btn-sm">Accept</button>
                                            <button onClick={() => handleStatusChange(task._id, 'refused')} className="btn btn-danger btn-sm">Refuse</button>
                                            <button onClick={() => handleDelete(task._id)} className="btn btn-dark btn-sm">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StreamPage;
