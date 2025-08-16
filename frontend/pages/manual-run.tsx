import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Cookies from 'js-cookie';

interface SearchTerm {
  id: number;
  term: string;
  is_active: boolean;
  created_at: string;
}

interface AIModel {
  id: number;
  name: string;
  provider: string;
  version: string;
  is_active: boolean;
  cost_per_million_input_usd?: string | null;
  cost_per_million_output_usd?: string | null;
}

interface Analysis {
  id: number;
  business_mentioned: boolean;
  mention_context: string;
  sentiment: string;
  confidence_score: number;
  analysis_timestamp: string;
  analysis_model: string;
  analysis_duration_ms?: number;
  raw_analysis_response?: string;
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
  search_timestamp: string;
  response_time_ms?: number;
  tokens_used?: number;
  current_cost_input_usd?: string | null;
  current_cost_output_usd?: string | null;
  analysis?: Analysis;
}

export default function ManualRun() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  
  // State for data
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  const [searchResults, setSearchResults] = useState<SearchLog[]>([]);
  
  // Loading states
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  
  // Running state
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [isRunningSearch, setIsRunningSearch] = useState(false);

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [runningSearches, setRunningSearches] = useState<Record<string, boolean>>({});
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchLog | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchSearchTerms();
      fetchAiModels();
      fetchSearchResults();
    }
  }, [user]);

  const fetchSearchTerms = async () => {
    try {
      console.log('Fetching search terms...');
      const response = await axios.get(`/api/search-terms/?_t=${Date.now()}`);
      console.log('Search terms response:', response.data);
      setSearchTerms(response.data);
    } catch (error) {
      console.error('Error fetching search terms:', error);
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const fetchAiModels = async () => {
    try {
      console.log('Fetching AI models...');
      const response = await axios.get(`/api/ai-models/?_t=${Date.now()}`);
      console.log('AI models response:', response.data);
      setAiModels(response.data);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchSearchResults = async () => {
    try {
      console.log('Fetching search results...');
      const response = await axios.get(`/api/search-logs/?_t=${Date.now()}`);
      console.log('Search results response:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const runSearch = async (termId: number, modelId: number) => {
    console.log('runSearch called with:', { termId, modelId });
    
    // Set loading state for this specific search
    const searchKey = `${termId}-${modelId}`;
    setRunningSearches(prev => ({ ...prev, [searchKey]: true }));
    
    try {
      const term = searchTerms.find(t => t.id === termId);
      const model = aiModels.find(m => m.id === modelId);
      
      if (!term || !model) {
        setErrorMessage('Search term or AI model not found');
        setShowErrorPopup(true);
        return;
      }

      const url = '/api/run-ai-search/';
      console.log('Making request to:', url);
      console.log('Request data:', { search_term_id: termId, ai_model_id: modelId });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          search_term_id: termId,
          ai_model_id: modelId
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
        } catch (e) {
          // Extract the actual error message from HTML
          const errorMatch = responseText.match(/<pre class="exception_value">([^<]+)<\/pre>/);
          const errorMessage = errorMatch ? errorMatch[1] : responseText.substring(0, 500);
          throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }
      }

      const responseText = await response.text();
      console.log('Success response text:', responseText);
      const result = JSON.parse(responseText);
      
      console.log('Parsed result:', result);
      console.log('Current searchResults before update:', searchResults);
      
      // Add the new result to the local state immediately
      setSearchResults(prev => {
        console.log('Updating searchResults with:', result);
        const updated = [result, ...prev];
        console.log('Updated searchResults:', updated);
        return updated;
      });
      
      // Also refresh from server to ensure consistency
      fetchSearchResults();
      
    } catch (error) {
      console.error('Error running search:', error);
      setErrorMessage(`Failed to run AI search: ${error}`);
      setShowErrorPopup(true);
    } finally {
      // Clear loading state for this specific search
      setRunningSearches(prev => ({ ...prev, [searchKey]: false }));
    }
  };

    const handleAddSearchTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSearchTerm.trim()) return;

    setIsAddingTerm(true);
    try {
      const response = await axios.post('/api/search-terms/', {
        term: newSearchTerm.trim()
      });

      // Add the new term to the list
      setSearchTerms(prev => [response.data, ...prev]);
      setNewSearchTerm('');
    } catch (error) {
      console.error('Error adding search term:', error);
      setErrorMessage('Failed to add search term. Please try again.');
      setShowErrorPopup(true);
    } finally {
      setIsAddingTerm(false);
    }
  };

  const handleRowClick = (result: SearchLog) => {
    setSelectedResult(result);
    setShowResultPopup(true);
  };

  const runAllSearches = async () => {
    if (searchTerms.length === 0 || aiModels.length === 0) {
      setErrorMessage('No search terms or AI models available.');
      setShowErrorPopup(true);
      return;
    }
    
    for (const term of searchTerms) {
      for (const model of aiModels) {
        await runSearch(term.id, model.id);
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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

  return (
    <>
      <Head>
        <title>Manual Run - GEOExplorer</title>
      </Head>
      
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <nav className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-foreground">GEOExplorer</h1>
                <Badge variant="secondary">Manual Run</Badge>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchSearchTerms();
                    fetchAiModels();
                    fetchSearchResults();
                  }}
                  disabled={isLoadingTerms || isLoadingModels || isLoadingResults}
                >
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Dashboard
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
            
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Manual Search Run</h2>
              <p className="text-muted-foreground">Test your search terms against different AI models</p>
            </div>

            {/* Add Search Term Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add New Search Term</CardTitle>
                <CardDescription>Create a new search term to monitor</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSearchTerm} className="space-y-4">
                  <div>
                    <label htmlFor="newSearchTerm" className="block text-sm font-medium mb-2">
                      Search Term
                    </label>
                    <Input
                      id="newSearchTerm"
                      type="text"
                      value={newSearchTerm}
                      onChange={(e) => setNewSearchTerm(e.target.value)}
                      placeholder="e.g., What is the best EoR provider?"
                      required
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={!newSearchTerm.trim() || isAddingTerm}
                    >
                      {isAddingTerm ? 'Adding...' : 'Add Search Term'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Run All Button */}
            <div className="mb-6">
              <Button 
                onClick={runAllSearches}
                disabled={Object.keys(runningSearches).length > 0 || searchTerms.length === 0 || aiModels.length === 0}
                className="mb-4"
              >
                {Object.keys(runningSearches).length > 0 ? 'Running Searches...' : 'Run All Searches'}
              </Button>
            </div>

            {/* Search Terms and AI Models Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Search Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Search Terms</CardTitle>
                  <CardDescription>Your monitored keywords and phrases</CardDescription>
                </CardHeader>
                
                <CardContent>
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
                      <p className="text-sm">No search terms available</p>
                      <p className="text-xs">Add search terms on the dashboard first</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Models */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Models</CardTitle>
                  <CardDescription>Available AI models for testing</CardDescription>
                </CardHeader>
                
                <CardContent>
                  {isLoadingModels ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading models...</p>
                    </div>
                  ) : aiModels.length > 0 ? (
                    <div className="space-y-2">
                      {aiModels.map((model) => (
                        <div key={model.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{model.name}</p>
                            <p className="text-xs text-muted-foreground">{model.provider} - {model.version}</p>
                          </div>
                          <Badge variant={model.is_active ? "default" : "secondary"} className="ml-2">
                            {model.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">No AI models available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Individual Run Controls */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Individual Search Runs</CardTitle>
                <CardDescription>Run specific search terms against specific AI models</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Search Term</th>
                        <th className="text-left p-3 font-medium">AI Model</th>
                        <th className="text-left p-3 font-medium">Last Run</th>
                        <th className="text-left p-3 font-medium">Latest Response</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchTerms.map((term) => (
                        aiModels.map((model) => {
                          // Find the most recent result for this term-model combination
                          const latestResult = searchResults
                            .filter(result => result.search_term?.id === term.id && result.ai_model?.id === model.id)
                            .sort((a, b) => new Date(b.search_timestamp).getTime() - new Date(a.search_timestamp).getTime())[0];
                          
                          return (
                            <tr 
                              key={`${term.id}-${model.id}`} 
                              className={`border-b hover:bg-muted/50 ${latestResult ? 'cursor-pointer' : ''}`}
                              onClick={() => latestResult && handleRowClick(latestResult)}
                            >
                              <td className="p-3">
                                <span className="font-medium">{term.term}</span>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{model.name}</Badge>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {latestResult ? (
                                  new Date(latestResult.search_timestamp).toLocaleString()
                                ) : (
                                  <span className="text-muted-foreground">Never run</span>
                                )}
                              </td>
                              <td className="p-3">
                                {latestResult ? (
                                  <div className="max-w-xs">
                                    <p className="text-sm line-clamp-2">
                                      {latestResult.response.substring(0, 150)}...
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {latestResult.analysis && (
                                        <>
                                          <Badge 
                                            variant={latestResult.analysis.business_mentioned ? "default" : "secondary"}
                                            className="text-xs"
                                          >
                                            {latestResult.analysis.business_mentioned ? "Mentioned" : "Not Mentioned"}
                                          </Badge>
                                          {latestResult.analysis.sentiment && (
                                            <Badge 
                                              variant={
                                                latestResult.analysis.sentiment === 'positive' ? 'default' : 
                                                latestResult.analysis.sentiment === 'negative' ? 'destructive' : 'secondary'
                                              }
                                              className="text-xs"
                                            >
                                              {latestResult.analysis.sentiment}
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No results</span>
                                )}
                              </td>
                              <td className="p-3">
                                <Button
                                  size="sm"
                                  onClick={() => runSearch(term.id, model.id)}
                                  disabled={runningSearches[`${term.id}-${model.id}`]}
                                >
                                  {runningSearches[`${term.id}-${model.id}`] ? 'Running...' : 'Run Search'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Search Results</CardTitle>
                <CardDescription>Latest AI model responses</CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoadingResults ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading results...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.slice(0, 10).map((result) => (
                      <div key={result.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{result.search_term.term}</Badge>
                            <Badge variant="secondary">{result.ai_model.name}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {result.analysis && (
                              <>
                                <Badge 
                                  variant={result.analysis.business_mentioned ? "default" : "secondary"}
                                >
                                  {result.analysis.business_mentioned ? "Mentioned" : "Not Mentioned"}
                                </Badge>
                                {result.analysis.sentiment && (
                                  <Badge 
                                    variant={
                                      result.analysis.sentiment === 'positive' ? 'default' : 
                                      result.analysis.sentiment === 'negative' ? 'destructive' : 'secondary'
                                    }
                                  >
                                    {result.analysis.sentiment}
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(result.search_timestamp).toLocaleString()}
                        </p>
                        
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <h4 className="text-sm font-medium mb-1">Query:</h4>
                          <p className="text-sm">{result.query}</p>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg">
                          <h4 className="text-sm font-medium mb-1">Response:</h4>
                          <p className="text-sm">{result.response}</p>
                        </div>
                        
                        {result.analysis && result.analysis.business_mentioned && result.analysis.mention_context && (
                          <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                            <h4 className="text-sm font-medium mb-1">Mention Context:</h4>
                            <p className="text-sm">{result.analysis.mention_context}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No search results yet</p>
                    <p className="text-sm">Run some searches to see results here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>



        {/* Error Popup */}
        {showErrorPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-96">{errorMessage}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowErrorPopup(false)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Result Popup */}
        {showResultPopup && selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Search Result Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedResult.search_term.term} • {selectedResult.ai_model.name}
                  </p>
                </div>
                <Button
                  onClick={() => setShowResultPopup(false)}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Search Term</p>
                    <p className="text-sm text-gray-900">{selectedResult.search_term.term}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">AI Model</p>
                    <p className="text-sm text-gray-900">{selectedResult.ai_model.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timestamp</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedResult.search_timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Response Time</p>
                    <p className="text-sm text-gray-900">
                      {selectedResult.response_time_ms}ms
                    </p>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Analysis Results</h4>
                  {selectedResult.analysis ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Business Mentioned</p>
                        <Badge 
                          variant={selectedResult.analysis.business_mentioned ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {selectedResult.analysis.business_mentioned ? "Yes" : "No"}
                        </Badge>
                      </div>
                      
                      {selectedResult.analysis.business_mentioned && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Sentiment</p>
                          <Badge 
                            variant={
                              selectedResult.analysis.sentiment === 'positive' ? 'default' : 
                              selectedResult.analysis.sentiment === 'negative' ? 'destructive' : 'secondary'
                            }
                            className="mt-1"
                          >
                            {selectedResult.analysis.sentiment || 'Neutral'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No analysis available</p>
                  )}
                </div>

                {/* Query */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Query Sent to AI</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedResult.query}</p>
                  </div>
                </div>

                {/* Full Response */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Full AI Response</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedResult.response}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}