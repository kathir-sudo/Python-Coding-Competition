import React from 'react';
import { TrophyIcon, ArrowLeftOnRectangleIcon } from './Icons';

interface ThankYouProps {
  message: string;
  onLogout: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ message, onLogout }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/70 border border-cyan-500/30 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
        <TrophyIcon className="mx-auto h-16 w-16 text-cyan-400" />
        <h2 className="text-3xl font-extrabold text-cyan-300 font-orbitron">
          Competition Over
        </h2>
        <p className="text-lg text-gray-300">
          {message} Thank you for participating!
        </p>

        <div className="pt-4">
            <button 
                onClick={onLogout}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-slate-500 text-sm font-medium text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500"
            >
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                Logout
            </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;