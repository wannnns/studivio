import React, { useState } from 'react';
import { StudySet, CAMBRIDGE_UNITS } from '../types';
import { Play, Mic, FileText, Layers, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface CreatorZoneProps {
    sets: StudySet[];
    onSelect: (set: StudySet) => void;
}

const CreatorZone: React.FC<CreatorZoneProps> = ({ sets, onSelect }) => {
    // Filter only 'creator' category (Official Resources)
    const officialSets = sets.filter(s => s.category === 'creator');
    
    // State for accordion
    const [openUnits, setOpenUnits] = useState<string[]>(CAMBRIDGE_UNITS);

    const toggleUnit = (unit: string) => {
        setOpenUnits(prev => 
            prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]
        );
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <header className="mb-8 border-b border-border pb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookOpen className="text-primary" size={32} />
                    Cambridge Psychology Curriculum
                </h1>
                <p className="text-slate-500 mt-2">
                    Official course materials, lectures, and flashcards organized by unit.
                </p>
            </header>

            <div className="space-y-6">
                {CAMBRIDGE_UNITS.map((unit) => {
                    const unitSets = officialSets.filter(s => s.unit === unit);
                    const isOpen = openUnits.includes(unit);

                    return (
                        <div key={unit} className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                            <button 
                                onClick={() => toggleUnit(unit)}
                                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-bold text-slate-800">{unit}</h2>
                                    <span className="text-xs font-semibold bg-blue-100 text-primary px-2 py-1 rounded-full">
                                        {unitSets.length} Resources
                                    </span>
                                </div>
                                {isOpen ? <ChevronDown className="text-slate-400" /> : <ChevronRight className="text-slate-400" />}
                            </button>

                            {isOpen && (
                                <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/50">
                                    {unitSets.length === 0 ? (
                                        <div className="col-span-full py-4 text-center text-slate-400 text-sm italic">
                                            No resources uploaded for this unit yet.
                                        </div>
                                    ) : (
                                        unitSets.map(set => (
                                            <ResourceCard key={set.id} set={set} onClick={() => onSelect(set)} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ResourceCard: React.FC<{ set: StudySet, onClick: () => void }> = ({ set, onClick }) => {
    let Icon = FileText;
    let colorClass = "text-slate-500";
    let bgClass = "bg-slate-100";

    switch(set.type) {
        case 'video': Icon = Play; colorClass = "text-red-500"; bgClass = "bg-red-50"; break;
        case 'podcast': Icon = Mic; colorClass = "text-purple-500"; bgClass = "bg-purple-50"; break;
        case 'flashcard': Icon = Layers; colorClass = "text-blue-500"; bgClass = "bg-blue-50"; break;
        default: Icon = FileText; colorClass = "text-green-500"; bgClass = "bg-green-50"; break;
    }

    return (
        <div 
            onClick={onClick} 
            className="group bg-white p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
        >
            <div className={`w-10 h-10 rounded-lg ${bgClass} ${colorClass} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                    {set.title}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                    {set.description || set.type}
                </p>
            </div>
        </div>
    );
};

export default CreatorZone;