import React, { useState } from 'react';
import { X, Github, ExternalLink, User } from 'lucide-react';
import devTeam from '../../data/devTeam';

const TeamMemberImage = ({ src, name }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-red-500/70 bg-slate-200 group">
      {/* Shimmer Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse">
           <div className="absolute inset-0 animate-shimmer" />
        </div>
      )}

      {/* Error Fallback */}
      {hasError ? (
        <div className="flex items-center justify-center w-full h-full bg-slate-100 text-slate-400">
          <User size={40} />
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

const DevTeamModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-slate-50">
          <div className="flex flex-col">
             <h2 className="text-2xl font-bold text-red-600">University Dev Team</h2>
             <p className='text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold'>Meet our brilliant minds</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
            {devTeam.map((member, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-slate-100 rounded-xl border border-gray-100 hover:shadow-inner hover:shadow-gray-300 transition-all hover:translate-y-1 duration-300"
              >
                <div className="mb-4">
                  <TeamMemberImage src={member.image} name={member.name} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 text-center leading-tight">{member.name}</h3>
                <p className="text-sm font-medium text-red-500 mb-2">{member.designation}</p>
                
                <div className="flex flex-col items-center gap-1 mb-4 text-center">
                  {member.department && (
                    <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-tight">
                      {member.department}
                    </p>
                  )}
                  {member.session && (
                    <p className="text-[10px] font-medium text-gray-400">
                      Session: {member.session}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 mt-auto">
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-white hover:bg-slate-800 border border-gray-200 hover:border-slate-800 transition-all shadow-sm"
                      title="GitHub Profile"
                    >
                      <Github size={18} />
                    </a>
                  )}
                  {member.portfolio && (
                    <a
                      href={member.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full text-gray-700 hover:text-white hover:bg-red-600 border border-gray-200 hover:border-red-600 transition-all shadow-sm"
                      title="Portfolio Website"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
            Pabna University of Science and Technology
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevTeamModal;
