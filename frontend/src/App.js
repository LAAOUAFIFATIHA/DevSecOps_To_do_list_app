import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
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
        <div className="App bg-light min-vh-100">
          {/* Main Navigation */}
          <nav className="navbar navbar-dark bg-dark shadow-sm">
            <div className="container">
              <a className="navbar-brand fw-bold" href="/">TaskStream Pro</a>
              <div>
                <a className="btn btn-outline-light btn-sm" href="/admin/login">Admin Console</a>
              </div>
            </div>
          </nav>

          <Switch>
            <Route exact path="/admin/login" component={AdminLogin} />
            <PrivateRoute exact path="/admin/dashboard" component={AdminDashboard} />
            <Route exact path="/stream/:streamId" component={StreamPage} />
            <Route exact path="/stream/:streamId/add" component={AddTask} />
            <Route path="/" render={() => (
              localStorage.getItem('admin_token')
                ? <Redirect to="/admin/dashboard" />
                : <Redirect to="/admin/login" />
            )} />
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
