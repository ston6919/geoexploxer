import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BusinessProfile {
  id: number;
  business_name: string;
  industry: string;
  business_description: string;
  onboarding_completed: boolean;
}

interface SearchTerm {
  id: number;
  term: string;
  is_active: boolean;
  created_at: string;
}

interface SearchLog {
  id: number;
  search_term: {
    id: number;
    term: string;
  };
  ai_model: {
    id: number;
    name: string;
  };
  query: string;
  response: string;
  business_mentioned: boolean;
  mention_context: string;
  sentiment: string;
  confidence_score: number;
  search_timestamp: string;
}

interface SearchAnalytics {
  total_searches: number;
  business_mentions: number;
  mention_rate: number;
  sentiment_breakdown: Array<{
    sentiment: string;
    count: number;
  }>;
  top_search_terms: Array<{
    search_term__term: string;
    count: number;
  }>;
  top_ai_models: Array<{
    ai_model__name: string;
    count: number;
  }>;
  date_range: string;
}

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // State for different sections
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  
  // New search term form
  const [newSearchTerm, setNewSearchTerm] = useState({ term: '' });
  const [isAddingTerm, setIsAddingTerm] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchBusinessProfile();
    }
  }, [user]);

  const fetchBusinessProfile = async () => {
    try {
      const response = await axios.get('/api/business/profile/');
      setBusinessProfile(response.data);
      
      // If profile exists, fetch other data
      if (response.data) {
        fetchSearchTerms();
        fetchSearchLogs();
        fetchAnalytics();
      }
    } catch (error: any) {
      console.error('Error fetching business profile:', error);
      // If no business profile found (404) or business profile is invalid (400), redirect to onboarding
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log('No business profile found, redirecting to onboarding');
        router.push('/onboarding');
        return;
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchSearchTerms = async () => {
    try {
      const response = await axios.get('/api/search-terms/');
      setSearchTerms(response.data);
    } catch (error) {
      console.error('Error fetching search terms:', error);
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const fetchSearchLogs = async () => {
    try {
      const response = await axios.get('/api/search-logs/');
      setSearchLogs(response.data);
    } catch (error) {
      console.error('Error fetching search logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/search-analytics/');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleAddSearchTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSearchTerm.term.trim()) return;
    
    setIsAddingTerm(true);
    try {
      console.log('Adding search term:', newSearchTerm);
      const response = await axios.post('/api/search-terms/', newSearchTerm);
      console.log('Search term added successfully:', response.data);
      setSearchTerms([...searchTerms, response.data]);
      setNewSearchTerm({ term: '' });
    } catch (error: any) {
      console.error('Error adding search term:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
        
        let errorMessage = 'Unknown error';
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = JSON.stringify(error.response.data);
          }
        }
        
        // Check if it's a business profile error
        if (error.response.status === 400 && error.response.data?.business_profile) {
          alert('You need to complete your business profile first. Please complete the onboarding process.');
          router.push('/onboarding');
        } else {
          alert(`Failed to add search term (${error.response.status}): ${errorMessage}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('Network error. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        alert(`Failed to add search term: ${error.message}`);
      }
    } finally {
      setIsAddingTerm(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If still loading profile, show loading
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no business profile, show redirect message
  if (!businessProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome to GEOExplorer!</CardTitle>
              <CardDescription>Let's set up your business profile to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/onboarding')} className="w-full">
                Complete Onboarding
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>GEOExplorer - Dashboard</title>
      </Head>
      
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <nav className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-foreground">GEOExplorer</h1>
                <Badge variant="secondary" className="ml-2">Dashboard</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/manual-run')}
                >
                  Manual Run
                </Button>
                <span className="text-muted-foreground">
                  Welcome, {user.first_name || user.username}!
                </span>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Business Profile Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Profile</CardTitle>
                    <CardDescription>Your business information and settings</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                        <p className="text-foreground font-medium">{businessProfile.business_name}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Industry</label>
                        <p className="text-foreground font-medium">{businessProfile.industry}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-foreground text-sm">{businessProfile.business_description}</p>
                      </div>
                      
                      <Badge variant={businessProfile.onboarding_completed ? "default" : "secondary"}>
                        {businessProfile.onboarding_completed ? "Onboarding Complete" : "Onboarding Pending"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search Terms Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Terms</CardTitle>
                    <CardDescription>Monitor keywords and phrases</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Add new search term form */}
                    <form onSubmit={handleAddSearchTerm} className="space-y-3 mb-4">
                      <Input
                        placeholder="Enter search term..."
                        value={newSearchTerm.term}
                        onChange={(e) => setNewSearchTerm({ term: e.target.value })}
                        disabled={isAddingTerm}
                      />
                      <Button type="submit" disabled={isAddingTerm || !newSearchTerm.term.trim()} size="sm" className="w-full">
                        {isAddingTerm ? 'Adding...' : 'Add Search Term'}
                      </Button>
                    </form>

                    {/* Debug button - remove this later */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mb-4"
                      onClick={() => {
                        console.log('Current user:', user);
                        console.log('Business profile:', businessProfile);
                        console.log('Search terms:', searchTerms);
                        console.log('Auth token:', document.cookie);
                      }}
                    >
                      Debug Info
                    </Button>

                    {/* Search terms list */}
                    {isLoadingTerms ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading terms...</p>
                      </div>
                    ) : searchTerms.length > 0 ? (
                      <div className="space-y-2">
                        {searchTerms.map((term) => (
                          <div key={term.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{term.term}</p>
                            </div>
                            <Badge variant={term.is_active ? "default" : "secondary"} className="ml-2">
                              {term.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No search terms yet</p>
                        <p className="text-xs">Add your first search term above</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Analytics Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Search Analytics</CardTitle>
                    <CardDescription>Performance insights</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingAnalytics ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Loading analytics...</p>
                      </div>
                    ) : analytics ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">{analytics.total_searches}</p>
                            <p className="text-xs text-muted-foreground">Total Searches</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">{analytics.business_mentions}</p>
                            <p className="text-xs text-muted-foreground">Mentions</p>
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <p className="text-2xl font-bold text-primary">{analytics.mention_rate}%</p>
                          <p className="text-xs text-muted-foreground">Mention Rate</p>
                        </div>
                        
                        {analytics.top_search_terms.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Top Search Terms</h4>
                            <div className="space-y-1">
                              {analytics.top_search_terms.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{item.search_term__term}</span>
                                  <span className="font-medium">{item.count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No analytics data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Search Logs */}
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Search Logs</CardTitle>
                  <CardDescription>Latest AI model interactions</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading logs...</p>
                    </div>
                  ) : searchLogs.length > 0 ? (
                    <div className="space-y-4">
                      {searchLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{log.search_term.term}</Badge>
                              <Badge variant="secondary">{log.ai_model.name}</Badge>
                            </div>
                            <Badge 
                              variant={log.business_mentioned ? "default" : "secondary"}
                            >
                              {log.business_mentioned ? "Mentioned" : "Not Mentioned"}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(log.search_timestamp).toLocaleString()}
                          </p>
                          
                          {log.business_mentioned && log.sentiment && (
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  log.sentiment === 'positive' ? 'default' : 
                                  log.sentiment === 'negative' ? 'destructive' : 'secondary'
                                }
                              >
                                {log.sentiment}
                              </Badge>
                              {log.confidence_score && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(log.confidence_score * 100)}% confidence
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No search logs yet</p>
                      <p className="text-sm">Search logs will appear here as you monitor terms</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

