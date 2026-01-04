import React, { useState, useEffect } from 'react';
import { getStreamDetails, voteTask } from './api';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const StreamPage = ({ match }) => {
    const streamId = match.params.streamId;
    const [stream, setStream] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        loadData();

        // Socket.io Setup
        const socket = io(window.location.origin, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5
        });

        socket.on('connect', () => {
            console.log('CLIENT: Connected to socket server');
            setConnected(true);
            socket.emit('join', { room: streamId });
        });

        socket.on('disconnect', () => {
            console.log('CLIENT: Disconnected from socket server');
            setConnected(false);
        });

        socket.on('new_task', (task) => {
            console.log('REAL-TIME: New task received', task);
            setTasks(prev => {
                // Prevent duplicate addition
                if (prev.find(t => t._id === task._id)) return prev;
                // Add new task to the TOP
                return [task, ...prev];
            });
        });

        socket.on('task_voted', (data) => {
            console.log('REAL-TIME: Task voted', data);
            setTasks(prev => prev.map(t =>
                t._id === data.taskId ? { ...t, votes: data.votes } : t
            ));
        });

        socket.on('task_status_changed', (data) => {
            console.log('REAL-TIME: Task status changed', data);
            setTasks(prev => prev.map(t =>
                t._id === data.taskId ? { ...t, status: data.status } : t
            ));
        });

        socket.on('task_deleted', ({ task_id }) => {
            console.log('REAL-TIME: Task deleted', task_id);
            setTasks(prev => prev.filter(t => t._id !== task_id));
        });

        return () => {
            console.log('CLIENT: Cleaning up socket');
            socket.disconnect();
        };
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
            const { data } = await voteTask(id);
            // Optimistic update already handled by socket event, 
            // but we can update state here if socket fails
        } catch (err) {
            console.error(err);
        }
    };

    if (!stream) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="container py-5 animate-fade-in">
            <header className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
                <div>
                    <h1 className="display-5 fw-bold mb-1">{stream.name}</h1>
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${connected ? 'bg-success' : 'bg-danger'}`}>
                            {connected ? '● Real-time Active' : '○ Reconnecting...'}
                        </span>
                        <span className="text-muted small">Stream ID: {streamId}</span>
                    </div>
                </div>
                <Link to={`/stream/${streamId}/add`} className="btn btn-primary btn-lg shadow-lg">
                    + Propose New Task
                </Link>
            </header>

            <div className="row g-4">
                {tasks.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <div className="glass-card p-5">
                            <p className="text-muted mb-0">No tasks proposed yet. Be the first!</p>
                        </div>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task._id} className="col-12">
                            <div className={`task-card p-4 d-flex justify-content-between align-items-center ${task.status === 'refused' ? 'opacity-50' : ''}`}>
                                <div className="d-flex gap-4 align-items-start">
                                    <div className="vote-btn btn btn-light border shadow-sm" onClick={() => handleVote(task._id)}>
                                        <span className="fs-4">👍</span>
                                        <span className="fw-bold">{task.votes}</span>
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className="badge bg-dark">{task.user_name}</span>
                                            {task.status !== 'pending' && (
                                                <span className={`badge status-badge-${task.status}`}>
                                                    {task.status.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="mb-0 fw-semibold text-dark">{task.description}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StreamPage;
