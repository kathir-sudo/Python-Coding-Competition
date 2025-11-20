import React, { useState, useEffect } from 'react';
import type { Problem, Team, Submission, CompetitionState, TestCase } from '../types';
import { api } from '../services/api';
import CodeEditor from './CodeEditor';
import Leaderboard from './Leaderboard';
// FIX: Import Results component to resolve 'Cannot find name' error.
import Results from './Results';
import { SpeakerWaveIcon, PauseIcon, PlayIcon } from './Icons';
import TeamStats from './TeamStats';

type AdminTab = 'controls' | 'problems' | 'teams' | 'submissions' | 'leaderboard';

const Admin: React.FC<{ setCompetitionState: (state: CompetitionState) => void }> = ({ setCompetitionState }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('controls');
    const [currentUser, setCurrentUser] = useState<Team | null>(null);

    useEffect(() => {
        const user = api.getCurrentUser();
        if(user && user.id !== 'admin'){
            setCurrentUser(user as Team)
        }
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'controls': return <AdminControls setGlobalState={setCompetitionState} />;
            case 'problems': return <AdminProblems />;
            case 'teams': return <AdminTeams />;
            case 'submissions': return <AdminSubmissions />;
            case 'leaderboard': return <Leaderboard team={currentUser as Team} />;
            default: return null;
        }
    };

    const TabButton: React.FC<{tab: AdminTab; label: string}> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-slate-800 border-x border-t border-slate-600 text-cyan-300' : 'text-gray-300 hover:bg-slate-700/50'}`}>
            {label}
        </button>
    );

    return (
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-cyan-300 font-orbitron">Admin Dashboard</h2>
            <div className="flex border-b border-slate-600">
                <TabButton tab="controls" label="Controls" />
                <TabButton tab="problems" label="Problems" />
                <TabButton tab="teams" label="Teams" />
                <TabButton tab="submissions" label="Submissions" />
                <TabButton tab="leaderboard" label="Leaderboard" />
            </div>
            <div className="bg-slate-800 p-6 border-x border-b border-slate-600">
                {renderTabContent()}
            </div>
        </div>
    );
};

const LiveSubmissionFeed: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const latestSubmissions = await api.getSubmissions();
                setSubmissions(latestSubmissions);
            } catch (error) {
                console.error("Failed to fetch submissions for live feed:", error);
            }
        };

        fetchSubmissions();
        const intervalId = setInterval(fetchSubmissions, 5000); // Poll every 5 seconds
        return () => clearInterval(intervalId);
    }, []);

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const seconds = Math.floor((now - timestamp) / 1000);
        if (seconds < 10) return "just now";
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="bg-slate-900 p-4 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 text-white font-orbitron">Live Submission Feed</h3>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
                {submissions.length > 0 ? submissions.map(s => (
                    <div key={s.id} className="bg-slate-800 p-3 shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-cyan-400">{s.teamName}</p>
                                <p className="text-sm text-gray-300">submitted to "{s.problemTitle}"</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 ${s.score > 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                                {s.score}/{s.results.length}
                            </span>
                        </div>
                        <p className="text-right text-xs text-gray-500 mt-1">{formatTimeAgo(s.timestamp)}</p>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">No submissions yet.</p>}
            </div>
        </div>
    );
};


interface BroadcastAnnouncementProps {
    state: CompetitionState | null;
    onStateUpdate: (newState: CompetitionState) => void;
}

const BroadcastAnnouncement: React.FC<BroadcastAnnouncementProps> = ({ state, onStateUpdate }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleBroadcast = async () => {
        if (!message.trim() || isSending) return;
        setIsSending(true);
        setFeedback('');
        try {
            const updatedState = await api.broadcastAnnouncement(message.trim());
            onStateUpdate(updatedState);
            setFeedback('Announcement sent successfully!');
            setMessage('');
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            setFeedback('Failed to send announcement.');
             setTimeout(() => setFeedback(''), 3000);
        } finally {
            setIsSending(false);
        }
    };
    
    const handleClear = async () => {
        if (isSending) return;
        setIsSending(true);
        setFeedback('');
        try {
            const updatedState = await api.broadcastAnnouncement('');
            onStateUpdate(updatedState);
            setFeedback('Announcement cleared.');
            setTimeout(() => setFeedback(''), 3000);
        } catch (error) {
            setFeedback('Failed to clear announcement.');
            setTimeout(() => setFeedback(''), 3000);
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="bg-slate-900 p-4 border border-slate-700">
            <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-2 font-orbitron"><SpeakerWaveIcon className="w-6 h-6"/> Broadcast</h3>
            {state?.announcement?.message ? (
                <div className="mb-4 bg-slate-800 p-3">
                    <p className="text-sm text-gray-400 font-semibold">Current Announcement:</p>
                    <p className="text-cyan-300">{state.announcement.message}</p>
                </div>
            ) : (
                <p className="text-sm text-gray-400 mb-4">Send a message that will appear as a banner for all contestants.</p>
            )}
            <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="E.g., 15 minutes remaining in the competition!"
                className="w-full bg-slate-800 text-white p-2 h-20 border border-slate-700 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={isSending}
            />
            <div className="flex justify-between items-center mt-2">
                <p className={`text-sm h-4 ${feedback.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>{feedback}</p>
                <div className="flex items-center gap-2">
                    {state?.announcement?.message && (
                        <button onClick={handleClear} disabled={isSending} className="px-6 py-2 bg-slate-600 font-semibold border border-slate-500 hover:bg-slate-500 disabled:opacity-50">
                            {isSending ? '...' : 'Clear'}
                        </button>
                    )}
                    <button
                        onClick={handleBroadcast}
                        disabled={isSending || !message.trim()}
                        className="px-6 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700 disabled:bg-cyan-800/50 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Sending...' : 'Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminControls: React.FC<{ setGlobalState: (state: CompetitionState) => void }> = ({ setGlobalState }) => {
    const [state, setState] = useState<CompetitionState | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        api.getCompetitionState().then(setState);
    }, []);
    
    const handleStateUpdate = (newState: CompetitionState) => {
        setState(newState);
        setGlobalState(newState);
    };

    const handleSave = async (newState: CompetitionState) => {
        setIsSaving(true);
        try {
            const updatedState = await api.updateCompetitionState(newState);
            handleStateUpdate(updatedState);
            alert('Settings saved!');
        } catch (error) {
            alert('Failed to save settings.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleCompetition = () => {
        if (!state) return;
        const newState = { ...state, isActive: !state.isActive };
        handleSave(newState);
    }
    
    const handleTogglePause = async () => {
      if (!state) return;
      setIsSaving(true);
      try {
        const updatedState = await api.toggleCompetitionPause();
        handleStateUpdate(updatedState);
      } catch (error) {
        alert('Failed to toggle pause state.');
      } finally {
        setIsSaving(false);
      }
    }
    
    if (!state) return <div>Loading controls...</div>;

    return (
        <div className="space-y-6 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-slate-900 p-4 border border-slate-700 space-y-4">
                         <div>
                            <h3 className="text-xl font-semibold font-orbitron">Competition Controls</h3>
                            <p className="text-sm text-gray-400">Manage the global state of the competition.</p>
                         </div>
                         <div className="flex gap-4">
                            <button 
                                onClick={handleToggleCompetition} 
                                disabled={isSaving}
                                className={`w-full px-6 py-2 font-bold border transition-colors disabled:opacity-50
                                    ${state.isActive ? 'bg-red-600/80 border-red-500 hover:bg-red-600' : 'bg-green-600/80 border-green-500 hover:bg-green-600'}`}
                            >
                                {isSaving ? '...' : state.isActive ? 'Stop Competition' : 'Start Competition'}
                            </button>
                             <button 
                                onClick={handleTogglePause} 
                                disabled={isSaving || !state.isActive}
                                className="w-full flex items-center justify-center gap-2 px-6 py-2 font-bold border transition-colors bg-yellow-600/80 border-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 disabled:border-slate-500 disabled:cursor-not-allowed"
                             >
                                {isSaving ? '...' : state.isPaused ? <><PlayIcon className="w-5 h-5"/> Resume</> : <><PauseIcon className="w-5 h-5"/> Pause</>}
                             </button>
                         </div>
                    </div>
                     <BroadcastAnnouncement state={state} onStateUpdate={handleStateUpdate} />
                </div>
                <LiveSubmissionFeed />
            </div>

            <div className="pt-6 border-t border-slate-700">
                <h3 className="text-xl font-semibold mb-4 font-orbitron">Detailed Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Competition Duration (minutes)</label>
                        <input type="number" value={state.timer} onChange={e => setState({...state, timer: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                    <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Violation Limit</label>
                        <input type="number" value={state.violationLimit} onChange={e => setState({...state, violationLimit: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold">Allow Hints</label>
                        <input type="checkbox" checked={state.allowHints} onChange={e => setState({...state, allowHints: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold">Enable Anti-Cheat</label>
                        <input type="checkbox" checked={state.useAntiCheat} onChange={e => setState({...state, useAntiCheat: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="flex items-center justify-between bg-slate-700 p-4">
                        <label className="font-semibold" title="Auto-submit and disqualify team if they switch tabs more than the limit.">Auto DQ on Tab Switch</label>
                        <input type="checkbox" checked={state.autoDisqualifyOnTabSwitch} onChange={e => setState({...state, autoDisqualifyOnTabSwitch: e.target.checked})} className="h-5 w-5 bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-600" />
                    </div>
                    <div className="bg-slate-700 p-4">
                        <label className="block mb-2 font-semibold">Tab Switch Limit</label>
                        <input type="number" value={state.tabSwitchViolationLimit} onChange={e => setState({...state, tabSwitchViolationLimit: parseInt(e.target.value) || 0})} className="w-full bg-slate-800 p-2 border border-slate-600"/>
                    </div>
                </div>
                <button onClick={() => handleSave(state)} disabled={isSaving} className="w-full mt-6 py-2 px-4 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700 disabled:bg-cyan-800/50">
                    {isSaving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    );
}

const emptyProblem: Omit<Problem, 'id'> = {
  title: '',
  description: '',
  inputFormat: '',
  outputFormat: '',
  constraints: [],
  hint: '',
  solution: '',
  visibleTestCases: [{ id: 1, input: '', expected: '' }],
  hiddenTestCases: [{ id: 1, input: '', expected: '' }],
};

const AdminProblems: React.FC = () => {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [editingProblem, setEditingProblem] = useState<Partial<Problem> | null>(null);

    const fetchProblems = () => api.getProblems().then(setProblems);

    useEffect(() => {
        fetchProblems();
    }, []);

    const handleDelete = async (problemId: string) => {
        if (window.confirm("Are you sure you want to delete this problem?")) {
            await api.deleteProblem(problemId);
            fetchProblems();
        }
    };

    const handleSave = async (problemToSave: Partial<Problem>) => {
        try {
            if (problemToSave.id) {
                await api.updateProblem(problemToSave as Problem);
            } else {
                await api.addProblem(problemToSave as Omit<Problem, 'id'>);
            }
            setEditingProblem(null);
            fetchProblems();
        } catch (error) {
            console.error("Failed to save problem", error);
            alert(`Error: ${(error as Error).message}`);
        }
    };

    if (editingProblem) {
        return <ProblemEditor problem={editingProblem} onSave={handleSave} onCancel={() => setEditingProblem(null)} />;
    }

    return (
        <div className="space-y-4 text-white">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold font-orbitron">Manage Problems</h3>
                <button onClick={() => setEditingProblem(emptyProblem)} className="px-4 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700">
                    Add New Problem
                </button>
            </div>
            <div className="space-y-2">
                {problems.map(p => (
                    <div key={p.id} className="bg-slate-700 p-3 flex justify-between items-center">
                        <span>{p.title}</span>
                        <div>
                            <button onClick={() => setEditingProblem(p)} className="text-sm text-cyan-400 hover:underline mr-4">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-sm text-red-400 hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const ProblemEditor: React.FC<{ problem: Partial<Problem>; onSave: (problem: Partial<Problem>) => void; onCancel: () => void; }> = ({ problem, onSave, onCancel }) => {
    const [editedProblem, setEditedProblem] = useState(problem);

    const handleChange = (field: keyof Problem, value: any) => {
        setEditedProblem(prev => ({ ...prev, [field]: value }));
    };

    const handleTestCaseChange = (type: 'visibleTestCases' | 'hiddenTestCases', index: number, field: keyof TestCase, value: any) => {
        const cases = [...(editedProblem[type] || [])];
        cases[index] = { ...cases[index], [field]: value, id: cases[index]?.id || index + 1 };
        handleChange(type, cases);
    };
    
    const addTestCase = (type: 'visibleTestCases' | 'hiddenTestCases') => {
        const cases = [...(editedProblem[type] || [])];
        handleChange(type, [...cases, { id: cases.length + 1, input: '', expected: '' }]);
    };

    return (
        <div className="space-y-4 text-white">
             <h3 className="text-xl font-semibold font-orbitron">{editedProblem.id ? 'Edit Problem' : 'Add New Problem'}</h3>
            <input type="text" placeholder="Title" value={editedProblem.title} onChange={e => handleChange('title', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Description" value={editedProblem.description} onChange={e => handleChange('description', e.target.value)} className="w-full bg-slate-700 p-2 h-24 border border-slate-600" />
            
            <input type="text" placeholder="Input Format" value={editedProblem.inputFormat} onChange={e => handleChange('inputFormat', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <input type="text" placeholder="Output Format" value={editedProblem.outputFormat} onChange={e => handleChange('outputFormat', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Constraints (one per line)" value={(editedProblem.constraints || []).join('\n')} onChange={e => handleChange('constraints', e.target.value.split('\n'))} className="w-full bg-slate-700 p-2 h-20 border border-slate-600" />
            <input type="text" placeholder="Hint" value={editedProblem.hint} onChange={e => handleChange('hint', e.target.value)} className="w-full bg-slate-700 p-2 border border-slate-600" />
            <textarea placeholder="Official Solution Code" value={editedProblem.solution} onChange={e => handleChange('solution', e.target.value)} className="w-full bg-slate-700 p-2 h-24 font-mono border border-slate-600" />
            
            {/* Test Cases */}
            <div>
                <h4>Visible Test Cases</h4>
                {(editedProblem.visibleTestCases || []).map((tc, i) => (
                    <div key={i} className="flex gap-2 my-1">
                        <textarea placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange('visibleTestCases', i, 'input', e.target.value)} className="w-1/2 bg-slate-600 p-1 text-xs h-16 border border-slate-500"/>
                        <textarea placeholder="Expected Output" value={tc.expected} onChange={e => handleTestCaseChange('visibleTestCases', i, 'expected', e.target.value)} className="w-1/2 bg-slate-600 p-1 text-xs h-16 border border-slate-500"/>
                    </div>
                ))}
                <button onClick={() => addTestCase('visibleTestCases')} className="text-xs text-cyan-400 hover:underline mt-1">+ Add Visible Case</button>
            </div>
             <div>
                <h4>Hidden Test Cases</h4>
                {(editedProblem.hiddenTestCases || []).map((tc, i) => (
                    <div key={i} className="flex gap-2 my-1">
                        <textarea placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange('hiddenTestCases', i, 'input', e.target.value)} className="w-1/2 bg-slate-600 p-1 text-xs h-16 border border-slate-500"/>
                        <textarea placeholder="Expected Output" value={tc.expected} onChange={e => handleTestCaseChange('hiddenTestCases', i, 'expected', e.target.value)} className="w-1/2 bg-slate-600 p-1 text-xs h-16 border border-slate-500"/>
                    </div>
                ))}
                 <button onClick={() => addTestCase('hiddenTestCases')} className="text-xs text-cyan-400 hover:underline mt-1">+ Add Hidden Case</button>
            </div>

            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-4 py-2 bg-slate-600 font-semibold border border-slate-500 hover:bg-slate-500">Cancel</button>
                <button onClick={() => onSave(editedProblem)} className="px-4 py-2 bg-cyan-600 font-semibold border border-cyan-500 hover:bg-cyan-700">Save Problem</button>
            </div>
        </div>
    );
};

const AdminTeams: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [nameFilter, setNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'finished' | 'disqualified'>('all');
    const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

    const fetchTeams = () => api.getTeams().then(setTeams);

    // FIX: useEffect callback should not return a promise. Wrap the call in an anonymous function.
    useEffect(() => {
        fetchTeams();
    }, []);

    const handleDelete = async (teamId: string) => {
        if (window.confirm("Are you sure you want to delete this team? This action is permanent.")) {
            await api.deleteTeam(teamId);
            fetchTeams();
        }
    }
    
    const handleStatusChange = async (teamId: string, newStatus: 'active' | 'finished' | 'disqualified') => {
        let statusPayload = { isDisqualified: false, hasFinished: false };
        if (newStatus === 'disqualified') {
            statusPayload.isDisqualified = true;
        } else if (newStatus === 'finished') {
            statusPayload.hasFinished = true;
        }

        try {
            await api.updateTeamStatus(teamId, statusPayload);
            fetchTeams();
        } catch (error) {
            console.error("Failed to update team status", error);
            alert("Could not update status.");
        }
    };
    
    const handleAdjustScore = async (teamId: string, teamName: string, currentScore: number) => {
        const newScoreStr = window.prompt(`Enter new score for team "${teamName}" (current is ${currentScore}):`);
        if (newScoreStr) {
            const newScore = parseInt(newScoreStr, 10);
            if (!isNaN(newScore) && newScore >= 0) {
                await api.adjustTeamScore(teamId, newScore);
                fetchTeams();
            } else {
                alert("Invalid score entered. Please enter a non-negative number.");
            }
        }
    };

    if (viewingTeamId) {
        return <TeamStats teamId={viewingTeamId} onBack={() => setViewingTeamId(null)} />;
    }

    const filteredTeams = teams.filter(team => {
        const nameMatch = team.name.toLowerCase().includes(nameFilter.toLowerCase());
        if (!nameMatch) return false;

        switch (statusFilter) {
            case 'active':
                return !team.isDisqualified && !team.hasFinished;
            case 'finished':
                return team.hasFinished;
            case 'disqualified':
                return team.isDisqualified;
            case 'all':
            default:
                return true;
        }
    }).sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        // Tie-breaker: earlier submission is better. Teams without submissions are ranked last.
        return (a.lastSubmissionTimestamp || Infinity) - (b.lastSubmissionTimestamp || Infinity);
    });

    return (
        <div className="space-y-4 text-white">
            <h3 className="text-xl font-semibold font-orbitron">Manage Teams</h3>
            <div className="flex gap-4">
                <input
                    type="text"
                    placeholder="Filter by team name..."
                    value={nameFilter}
                    onChange={e => setNameFilter(e.target.value)}
                    className="w-full bg-slate-700 p-2 border border-slate-600"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="bg-slate-700 border border-slate-600 text-white p-2"
                >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                    <option value="disqualified">Disqualified</option>
                </select>
            </div>
             <div className="overflow-x-auto">
                 <table className="min-w-full text-sm">
                    <thead className="text-left">
                        <tr className="border-b border-slate-600">
                            <th className="p-2">Rank</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Score</th>
                            <th className="p-2">Violations</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeams.map((t, index) => (
                            <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="p-2">{index + 1}</td>
                                <td className="p-2 font-semibold">{t.name}</td>
                                <td className="p-2">{t.score}</td>
                                <td className="p-2" title={`Tab Switches: ${t.tabSwitchViolations}`}>{t.violations}</td>
                                <td className="p-2">
                                     <select
                                        value={t.isDisqualified ? 'disqualified' : t.hasFinished ? 'finished' : 'active'}
                                        onChange={e => handleStatusChange(t.id, e.target.value as any)}
                                        className="bg-slate-700 border border-slate-600 text-white text-sm p-1 w-full"
                                    >
                                        <option value="active">Active</option>
                                        <option value="finished">Finished</option>
                                        <option value="disqualified">Disqualified</option>
                                    </select>
                                </td>
                                <td className="p-2 text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        <button onClick={() => setViewingTeamId(t.id)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500">Stats</button>
                                        <button onClick={() => handleAdjustScore(t.id, t.name, t.score)} className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500">Score</button>
                                        <button onClick={() => handleDelete(t.id)} className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {filteredTeams.length === 0 && (
                            <tr><td colSpan={6} className="text-center p-4 text-gray-400">No matching teams found.</td></tr>
                        )}
                    </tbody>
                 </table>
             </div>
        </div>
    );
}

const AdminSubmissions: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selected, setSelected] = useState<Submission | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');
    const [teamFilter, setTeamFilter] = useState('');

    useEffect(() => { api.getSubmissions().then(subs => setSubmissions(subs.sort((a,b) => b.timestamp - a.timestamp))) }, []);

    const filteredSubmissions = submissions.filter(s => {
      if (teamFilter && !s.teamName.toLowerCase().includes(teamFilter.toLowerCase())) {
        return false;
      }
      if (filterStatus === 'success') {
          return s.results.length > 0 && s.score === s.results.length;
      }
      if (filterStatus === 'failed') {
          return s.score < s.results.length;
      }
      return true;
    });

    const FilterButton: React.FC<{ status: 'all' | 'success' | 'failed', label: string }> = ({ status, label }) => (
        <button 
            onClick={() => setFilterStatus(status)} 
            className={`px-3 py-1 text-xs font-medium ${filterStatus === status ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
                <div className="flex space-x-2 mb-2">
                    <FilterButton status="all" label="All" />
                    <FilterButton status="success" label="Success" />
                    <FilterButton status="failed" label="Failed" />
                </div>
                 <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Filter by team name..."
                        value={teamFilter}
                        onChange={e => setTeamFilter(e.target.value)}
                        className="w-full bg-slate-900 text-white p-2 border border-slate-700 text-sm"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto space-y-2">
                    {filteredSubmissions.map(s => (
                        <div key={s.id} onClick={() => setSelected(s)} className={`p-2 cursor-pointer ${selected?.id === s.id ? 'bg-cyan-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-bold">{s.teamName} - {s.problemTitle}</p>
                                <span className={`text-xs px-2 py-0.5 ${s.score === s.results.length && s.results.length > 0 ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                                    {s.score}/{s.results.length}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(s.timestamp).toLocaleString()}</p>
                        </div>
                    ))}
                     {filteredSubmissions.length === 0 && (
                        <div className="text-center text-gray-500 p-4">No matching submissions.</div>
                    )}
                </div>
            </div>
            <div className="md:col-span-2 bg-slate-900 border border-slate-700 p-4">
                {selected ? (
                    <div>
                        <h4 className="text-lg font-bold mb-2 font-orbitron">Code</h4>
                        <div className="h-64 mb-4">
                            <CodeEditor code={selected.code} onCodeChange={() => {}} problemId={selected.problemId} readOnly />
                        </div>
                        <h4 className="text-lg font-bold mb-2 font-orbitron">Results</h4>
                        <div className="h-48">
                           <Results results={selected.results} />
                        </div>
                    </div>
                ) : <p>Select a submission to view details.</p>}
            </div>
        </div>
    );
}

export default Admin;