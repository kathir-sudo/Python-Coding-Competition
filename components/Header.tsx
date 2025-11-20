import React, { useState, useEffect } from 'react';
import type { User, View, Team, CompetitionState, Problem } from '../types';
import { UserIcon, CodeBracketIcon, TrophyIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, ClockIcon, PauseIcon } from './Icons';
import { api } from '../services/api';

interface HeaderProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
  competitionState: CompetitionState | null;
}

const Header: React.FC<HeaderProps> = ({ currentUser, setCurrentUser, setCurrentView, onLogout, competitionState }) => {
  const isTeam = currentUser && currentUser.id !== 'admin';
  const team = isTeam ? currentUser as Team : null;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false);
  const [unattemptedProblems, setUnattemptedProblems] = useState<Problem[] | null>(null);
  const [isCheckingSubmissions, setIsCheckingSubmissions] = useState(false);
  
  const competitionEndedForTeam = team?.hasFinished || team?.isDisqualified;

  useEffect(() => {
    if (!isTeam || !competitionState?.isActive || competitionEndedForTeam) {
      setTimeLeft(null);
      return;
    }

    if (competitionState.isPaused) {
      // If paused, timer freezes. No interval needed.
      return;
    }
    
    // Not paused, so run the timer
    const timeLeftOnPauseStr = localStorage.getItem('timeLeftOnPause');
    const competitionDurationMs = competitionState.timer * 60 * 1000;
    let remainingMs;

    if (timeLeftOnPauseStr) {
      // Resuming from a pause
      remainingMs = parseInt(timeLeftOnPauseStr, 10);
      localStorage.removeItem('timeLeftOnPause');
    } else {
      // Fresh start or normal reload. Check for an existing end time.
      const storedEndTime = localStorage.getItem('competitionEndTime');
      remainingMs = storedEndTime ? parseInt(storedEndTime, 10) - Date.now() : competitionDurationMs;
    }
    
    const endTime = Date.now() + Math.max(0, remainingMs);
    localStorage.setItem('competitionEndTime', String(endTime));

    const calculateTimeLeft = () => {
        const remaining = Math.max(0, endTime - Date.now());
        setTimeLeft(remaining);
        if (remaining === 0 && !competitionEndedForTeam && team) {
            api.finishContest(team.id).then(updatedTeam => setCurrentUser(updatedTeam));
            setCurrentView('thankyou');
        }
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 1000);

    return () => {
      clearInterval(intervalId);
      // On cleanup (e.g., when isPaused becomes true), save the remaining time.
      const remaining = Math.max(0, endTime - Date.now());
      localStorage.setItem('timeLeftOnPause', String(remaining));
    };
  }, [isTeam, competitionState?.isActive, competitionState?.isPaused, competitionEndedForTeam, team, competitionState?.timer, setCurrentUser, setCurrentView]);

  const formatTime = (ms: number | null) => {
      if (ms === null) return null;
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };
  
  const handleFinishContest = async () => {
    if (!team) return;
    setIsCheckingSubmissions(true);
    try {
      const [allProblems, teamSubmissions] = await Promise.all([
        api.getProblems(),
        api.getSubmissionsByTeam(team.id)
      ]);

      const submittedProblemIds = new Set(teamSubmissions.map(sub => sub.problemId));
      const unattempted = allProblems.filter(p => !submittedProblemIds.has(p.id));

      if (unattempted.length > 0) {
        setUnattemptedProblems(unattempted);
      } else {
        setIsConfirmingFinish(true);
      }
    } catch (error) {
      console.error("Error checking submissions before finishing:", error);
      // Fallback to old behavior if API fails.
      setIsConfirmingFinish(true);
    } finally {
      setIsCheckingSubmissions(false);
    }
  };

  const confirmFinishContest = async () => {
    if (!team) return;
    try {
      const updatedTeam = await api.finishContest(team.id);
      setCurrentUser(updatedTeam);
      setCurrentView('thankyou');
    } catch (error) {
        console.error("Could not finish the contest.", error);
    } finally {
        setIsConfirmingFinish(false);
    }
  };

  const formattedTime = formatTime(timeLeft);


  return (
    <>
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-cyan-500/30">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-16">
          <div 
            className={`flex items-center space-x-2 ${!competitionEndedForTeam ? 'cursor-pointer' : ''}`}
            onClick={!competitionEndedForTeam ? () => setCurrentView('challenge') : undefined}
          >
            <CodeBracketIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-xl font-bold text-cyan-300 font-orbitron">PyCompete</h1>
          </div>
          
          {isTeam && !competitionEndedForTeam && (
            <nav className="hidden md:flex items-center space-x-4">
              <button onClick={() => setCurrentView('challenge')} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 border border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">
                <CodeBracketIcon className="h-5 w-5" />
                <span>Challenge</span>
              </button>
               <button onClick={() => setCurrentView('history')} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 border border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">
                <ClockIcon className="h-5 w-5" />
                <span>History</span>
              </button>
            </nav>
          )}

          {currentUser?.id === 'admin' && (
             <nav className="hidden md:flex items-center space-x-4">
              <button onClick={() => setCurrentView('admin')} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 border border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">
                <Cog6ToothIcon className="h-5 w-5" />
                <span>Admin Dashboard</span>
              </button>
             </nav>
          )}
          
          <div className="flex items-center space-x-4">
            {isTeam && competitionState?.isActive && !competitionEndedForTeam && (
              <div className="flex items-center space-x-4">
                  <button
                    onClick={handleFinishContest}
                    disabled={isCheckingSubmissions}
                    className="px-4 py-2 text-sm font-semibold transition-colors border border-red-500/80 bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-red-200 disabled:opacity-50 disabled:cursor-wait"
                  >
                    {isCheckingSubmissions ? 'Checking...' : 'Finish Contest'}
                  </button>
                  {formattedTime && (
                      <div className={`flex items-center space-x-2 text-lg ${timeLeft !== null && timeLeft < 5 * 60 * 1000 ? 'text-red-400' : 'text-cyan-400'}`}>
                          <ClockIcon className="h-5 w-5" />
                          <span>{formattedTime}</span>
                          {competitionState?.isPaused && <PauseIcon className="h-5 w-5 text-yellow-400" title="Competition is paused" />}
                      </div>
                  )}
              </div>
            )}
            {currentUser ? (
              <>
                {!competitionEndedForTeam && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium text-white hidden sm:inline">{currentUser.name}</span>
                  </div>
                )}
                <button onClick={onLogout} className="p-2 text-gray-400 hover:bg-slate-700 hover:text-white transition-colors" title="Logout">
                  <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                </button>
              </>
            ) : (
               <button onClick={() => setCurrentView('login')} className="px-3 py-2 text-sm font-medium text-gray-300 border border-transparent hover:border-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors">Login</button>
            )}
          </div>
        </div>
      </header>

      {unattemptedProblems && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-slate-900 shadow-2xl p-8 max-w-lg w-full border border-yellow-500 text-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="mt-4 text-2xl font-bold text-yellow-400 mb-4 font-orbitron">Unattempted Problems</h3>
            <p className="text-gray-300 mb-4">You must attempt all problems before you can finish the contest. You have not made any submissions for the following problems:</p>
            <ul className="text-left text-gray-200 bg-slate-800 p-3 mb-6 border border-slate-700 list-disc list-inside">
                {unattemptedProblems.map(p => <li key={p.id}>{p.title}</li>)}
            </ul>
            <div className="flex justify-center">
               <button
                onClick={() => setUnattemptedProblems(null)}
                className="px-8 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmingFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div className="bg-slate-900 shadow-2xl p-8 max-w-md w-full border border-red-500 text-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.008v.008H12v-.008Z" />
            </svg>
            <h3 className="mt-4 text-2xl font-bold text-red-400 mb-4 font-orbitron">Finish Contest?</h3>
            <p className="text-gray-300 mb-6">This action is final and you cannot return to the problems.</p>
            <div className="flex justify-center gap-4">
               <button
                onClick={() => setIsConfirmingFinish(false)}
                className="px-6 py-2 bg-slate-600 text-white font-semibold border border-slate-500 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinishContest}
                className="px-6 py-2 bg-red-600 text-white font-semibold border border-red-500 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
              >
                Confirm Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;