import React from 'react';
import { ExclamationTriangleIcon } from './Icons';

const competitionRules = [
    "Do not switch tabs or minimize the competition window.",
    "Do not use external code, libraries, or AI code generators unless specified.",
    "No communication with other individuals during the competition.",
    "Copying, pasting, and right-clicking are disabled for anti-cheat purposes.",
    "All violations are tracked and may lead to score penalties or disqualification.",
];

const PauseOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100]" aria-modal="true" role="dialog">
      <div className="w-full max-w-2xl p-8 space-y-6 text-center text-white">
        <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-400" />
        <h2 className="text-3xl font-extrabold text-yellow-300 font-orbitron">
          Competition Paused
        </h2>
        <p className="text-lg text-gray-300">
          The competition has been paused by the administrator. Your timer has stopped. Please wait for the competition to resume.
        </p>
        <div className="pt-4 text-left bg-slate-800/50 border border-slate-700 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 text-center">Rules Reminder</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
                {competitionRules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default PauseOverlay;
