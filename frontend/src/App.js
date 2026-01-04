import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminStreamPage from './AdminStreamPage';
import StreamPage from './StreamPage';
import AddTask from './AddTask';

// Simple protected route helper
const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(props) => (
    localStorage.getItem('admin_token')
      ? <Component {...props} />
      : <Redirect to='/admin/login' />
  )} />
);

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App min-vh-100">
          {/* Enhanced Navbar */}
          <nav className="navbar navbar-expand-lg navbar-dark shadow-lg sticky-top">
            <div className="container">
              <Link className="navbar-brand" to="/">
                <span className="fs-3"></span> <strong>TaskStream</strong> <small className="opacity-75">PRO</small>
              </Link>
              <div className="ms-auto flex-row d-flex gap-2">
                {localStorage.getItem('admin_token') && (
                  <>
                    <Link className="btn btn-outline-light btn-sm px-3 rounded-pill" to="/admin/dashboard">Admin Console</Link>
                    <button
                      className="btn btn-danger btn-sm px-3 rounded-pill"
                      onClick={() => {
                        localStorage.removeItem('admin_token');
                        window.location.href = '/admin/login';
                      }}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>

          <Switch>
            <Route exact path="/admin/login" component={AdminLogin} />
            <PrivateRoute exact path="/admin/dashboard" component={AdminDashboard} />
            <PrivateRoute exact path="/admin/stream/:streamId" component={AdminStreamPage} />
            <Route exact path="/stream/:streamId" component={StreamPage} />
            <Route exact path="/stream/:streamId/add" component={AddTask} />
            <Route path="/" render={() => (
              localStorage.getItem('admin_token')
                ? <Redirect to="/admin/dashboard" />
                : <Route exact path="/" render={() => (
                  <div className="container py-5 text-center animate-fade-in">
                    <div className="glass-card p-5">
                      <h1 className="display-4 fw-bold mb-3">Enterprise Real-time Tasks</h1>
                      <p className="lead text-muted mb-4">Scan a QR code or use a stream link to start collaborating.</p>
                      <Link to="/admin/login" className="btn btn-primary btn-lg px-5">Admin Portal</Link>
                    </div>
                  </div>
                )} />
            )} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
