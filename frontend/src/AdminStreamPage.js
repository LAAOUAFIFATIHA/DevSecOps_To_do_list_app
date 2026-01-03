import React, { useState, useEffect } from 'react';
import { getStreamDetails, voteTask, deleteTask, updateTaskStatus } from './api';
import io from 'socket.io-client';

const AdminStreamPage = ({ match }) => {
    const streamId = match.params.streamId;
    const [stream, setStream] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        loadData();

        const socket = io(window.location.origin, {
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join', { room: streamId });
        });

        socket.on('disconnect', () => setConnected(false));

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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this task?')) return;
        try { await deleteTask(id); } catch (err) { console.error(err); }
    };

    const handleStatus = async (id, status) => {
        try { await updateTaskStatus(id, status); } catch (err) { console.error(err); }
    };

    if (!stream) return <div className="text-center p-5">Loading Admin View...</div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <span className="badge bg-danger mb-2">ADMIN INSTRUMENTATION</span>
                    <h1 className="fw-bold">{stream.name}</h1>
                </div>
                <div className={`badge ${connected ? 'bg-success' : 'bg-secondary'}`}>
                    {connected ? 'Sync Connected' : 'Sync Lost'}
                </div>
            </div>

            <div className="table-responsive glass-card p-4">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Description</th>
                            <th>Votes</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task._id}>
                                <td><span className="fw-bold">{task.user_name}</span></td>
                                <td>{task.description}</td>
                                <td><span className="badge bg-light text-dark border">{task.votes}</span></td>
                                <td>
                                    <span className={`badge status-badge-${task.status}`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="text-end">
                                    <div className="btn-group btn-group-sm shadow-sm">
                                        <button onClick={() => handleStatus(task._id, 'accepted')} className="btn btn-outline-success">Accept</button>
                                        <button onClick={() => handleStatus(task._id, 'refused')} className="btn btn-outline-warning">Refuse</button>
                                        <button onClick={() => handleDelete(task._id)} className="btn btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminStreamPage;
