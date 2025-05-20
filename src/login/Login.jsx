import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    ibsEmpId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user, navigate]);

  const redirectBasedOnRole = (role) => {
    switch(role) {
      case 'EMPLOYEE':
        navigate('/employee-dashboard');
        break;
      case 'TEAM_MANAGER':
        navigate('/tm-dashboard');
        break;
      case 'SDM':
        navigate('/sdm-dashboard');
        break;
      case 'HR':
        navigate('/hr-dashboard');
        break;
      default:
        navigate('/login');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
      redirectBasedOnRole(user.role)
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-extralight tracking-wide text-gray-800">Welcome</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="ibsEmpId" className="sr-only">Employee ID</label>
              <input
                id="ibsEmpId"
                name="ibsEmpId"
                type="text"
                required
                value={credentials.ibsEmpId}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                placeholder="Employee ID"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="w-full px-4 py-3 text-sm border-b border-gray-300 focus:border-indigo-500 focus:outline-none"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${loading ? 'opacity-80' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;