import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';

interface HelloWorldResponse {
  message: string;
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    date_joined: string;
  };
}

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [helloData, setHelloData] = useState<HelloWorldResponse | null>(null);
  const [isLoadingHello, setIsLoadingHello] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchHelloWorld();
    }
  }, [user]);

  const fetchHelloWorld = async () => {
    try {
      const response = await axios.get('/api/hello/');
      setHelloData(response.data);
    } catch (error) {
      console.error('Error fetching hello world:', error);
    } finally {
      setIsLoadingHello(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GEOExplorer - Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">GEOExplorer</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.first_name || user.username}!
                </span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hello World Card */}
              <div className="lg:col-span-2">
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Hello World!
                  </h2>
                  
                  {isLoadingHello ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading message...</p>
                    </div>
                  ) : helloData ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-lg font-medium">
                          {helloData.message}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">API Response:</h3>
                        <pre className="text-sm text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                          {JSON.stringify(helloData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      Failed to load message
                    </div>
                  )}
                </div>
              </div>

              {/* User Info Card */}
              <div className="lg:col-span-1">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Your Profile
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p className="text-gray-900">{user.username}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <p className="text-gray-900">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={fetchHelloWorld}
                      disabled={isLoadingHello}
                      className="btn-primary w-full"
                    >
                      {isLoadingHello ? 'Refreshing...' : 'Refresh Message'}
                    </button>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="btn-secondary w-full"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

