import React, { useState } from 'react';
import { BookOpen, PlusCircle, Home, Layers, Mic, Upload, FileText, PenTool, Trash2, Video } from 'lucide-react';
import { StudySet, ViewState, ResourceType, Flashcard, CAMBRIDGE_UNITS } from './types';
import StudyViewer from './components/StudyViewer';
import CreatorZone from './components/CreatorZone';
import { generateFlashcardsFromContent, generatePodcastAudio, fileToGenerativePart } from './services/geminiService';

// --- MOCK DATA FOR CAMBRIDGE PSYCHOLOGY ---
const INITIAL_SETS: StudySet[] = [
  {
    id: 'c1',
    title: 'Milgram (1963) Obedience',
    description: 'Video summary of the shock experiment.',
    type: 'video',
    category: 'creator',
    unit: 'Unit 4: Social Approach',
    videoUrl: 'https://www.youtube.com/watch?v=mOUEC5YXV8U',
    createdAt: Date.now()
  },
  {
    id: 'c2',
    title: 'Bandura et al. - Bobo Doll',
    description: 'Key study details for the Learning Approach.',
    type: 'podcast',
    category: 'creator',
    unit: 'Unit 5: Learning Approach',
    createdAt: Date.now()
  },
  {
    id: 'c3',
    title: 'Research Methods Key Terms',
    description: 'IV, DV, Hypothesis types, and designs.',
    type: 'flashcard',
    category: 'creator',
    unit: 'Unit 1: Experiments and Self Reports',
    cards: [
        { id: '1', term: 'Independent Variable (IV)', definition: 'The variable manipulated by the researcher to see if it causes a change.' },
        { id: '2', term: 'Dependent Variable (DV)', definition: 'The variable measured to see if it changes as a result of the IV.' },
        { id: '3', term: 'Demand Characteristics', definition: 'Cues in an experiment that tell the participant what behavior is expected.' },
        { id: '4', term: 'Ecological Validity', definition: 'The extent to which the findings of a research study are able to be generalized to real-life settings.' }
    ],
    createdAt: Date.now()
  },
  {
    id: 'c4',
    title: 'Maguire - Taxi Drivers',
    description: 'Brain plasticity and the hippocampus.',
    type: 'flashcard',
    category: 'creator',
    unit: 'Unit 7: Biological Approach',
    cards: [
        { id: 'm1', term: 'Aim', definition: 'To investigate whether changes could be detected in the brains of London taxi drivers and to see if there was a correlation between time spent driving and brain structure.' },
        { id: 'm2', term: 'Sample', definition: '16 right-handed male London taxi drivers.' },
        { id: 'm3', term: 'VBM', definition: 'Voxel-Based Morphometry - used to measure the density of grey matter in the brain.' }
    ],
    createdAt: Date.now()
  },
  {
    id: 'p1',
    title: 'Canli et al. Study Guide',
    description: 'Amygdala activation notes.',
    type: 'note',
    category: 'public',
    unit: 'Unit 7: Biological Approach',
    content: "The aim was to show that emotive images will be remembered better than those that have little emotional impact on an individual.\n\nParticipants were shown 96 scenes...",
    createdAt: Date.now()
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [sets, setSets] = useState<StudySet[]>(INITIAL_SETS);
  const [activeSet, setActiveSet] = useState<StudySet | null>(null);

  // Creation State
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [createInput, setCreateInput] = useState('');
  const [createType, setCreateType] = useState<ResourceType>('flashcard');
  const [selectedUnit, setSelectedUnit] = useState<string>(CAMBRIDGE_UNITS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Manual Flashcard State
  const [manualCards, setManualCards] = useState<Flashcard[]>([{ id: 'm1', term: '', definition: '' }]);
  const [manualTitle, setManualTitle] = useState('');

  // Navigation Helper
  const navigate = (newView: ViewState) => {
    setView(newView);
    if (newView !== 'study') setActiveSet(null);
  };

  const handleSetClick = (set: StudySet) => {
    setActiveSet(set);
    setView('study');
  };

  // --- MANUAL CREATION LOGIC ---
  const handleAddManualCard = () => {
    setManualCards([...manualCards, { id: `m${Date.now()}`, term: '', definition: '' }]);
  };

  const handleUpdateManualCard = (index: number, field: 'term' | 'definition', value: string) => {
    const newCards = [...manualCards];
    newCards[index][field] = value;
    setManualCards(newCards);
  };

  const handleDeleteManualCard = (index: number) => {
    setManualCards(manualCards.filter((_, i) => i !== index));
  };

  const handleManualSubmit = () => {
    if (!manualTitle) {
        alert("Please enter a title for your set.");
        return;
    }
    
    const newSet: StudySet = {
        id: `man-${Date.now()}`,
        title: manualTitle,
        description: 'Manually created study set',
        type: createType,
        category: 'personal',
        unit: selectedUnit, // Optional for personal, but good to have
        createdAt: Date.now(),
    };

    if (createType === 'flashcard') {
        const validCards = manualCards.filter(c => c.term.trim() && c.definition.trim());
        if (validCards.length === 0) {
            alert("Please add at least one complete flashcard.");
            return;
        }
        newSet.cards = validCards;
    } else {
        // Note
        if (!createInput.trim()) {
            alert("Please enter some content for your note.");
            return;
        }
        newSet.content = createInput;
    }

    setSets([newSet, ...sets]);
    // Reset
    setManualTitle('');
    setCreateInput('');
    setManualCards([{ id: 'm1', term: '', definition: '' }]);
    navigate('dashboard');
  };

  // --- AI CREATION LOGIC ---
  const handleAICreate = async () => {
    if ((!createInput && !selectedFile) || isGenerating) return;

    setIsGenerating(true);
    try {
        let newSet: StudySet = {
            id: `ai-${Date.now()}`,
            title: 'New AI Generated Set',
            description: 'Generated from your materials',
            type: createType,
            category: 'personal',
            unit: selectedUnit,
            createdAt: Date.now(),
        };

        if (createType === 'flashcard') {
            let imagePart = null;
            if (selectedFile) {
                 imagePart = await fileToGenerativePart(selectedFile);
            }
            const cards = await generateFlashcardsFromContent(createInput || "Generate from the image", imagePart);
            newSet.cards = cards;
            newSet.title = createInput ? `AI Flashcards: ${createInput.substring(0, 15)}...` : 'AI Flashcards from Image';

        } else if (createType === 'podcast') {
            const audioData = await generatePodcastAudio(createInput);
            if (audioData) {
                newSet.audioUrl = audioData;
                newSet.title = `AI Podcast: ${createInput.substring(0, 15)}...`;
            } else {
                alert("Failed to generate audio. Try shorter text.");
                setIsGenerating(false);
                return;
            }
        } else {
            newSet.content = createInput;
            newSet.title = `AI Notes: ${createInput.substring(0, 15)}...`;
        }

        setSets([newSet, ...sets]);
        setCreateInput('');
        setSelectedFile(null);
        setView('dashboard');
    } catch (e) {
        console.error(e);
        alert("Something went wrong generating your content.");
    } finally {
        setIsGenerating(false);
    }
  };

  // --- RENDER VIEWS ---

  const renderDashboard = () => (
    <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Welcome Back.</h1>
            <p className="text-slate-500 mt-1">Ready to master Cambridge Psychology?</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div onClick={() => navigate('create')} className="bg-white border border-blue-200 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-40 group">
                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <PlusCircle size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Create New</h3>
                    <p className="text-slate-500 text-sm">AI or Manual Entry</p>
                </div>
            </div>
            <div onClick={() => navigate('curriculum')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-40 group">
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Curriculum</h3>
                    <p className="text-slate-500 text-sm">7 Units of Resources</p>
                </div>
            </div>
            <div onClick={() => navigate('library')} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-40 group">
                <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                    <Layers size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Public Library</h3>
                    <p className="text-slate-500 text-sm">Community Sets</p>
                </div>
            </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">Your Personal Sets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.filter(s => s.category === 'personal').length === 0 ? (
                <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400">No personal sets yet. Start creating!</p>
                    <button onClick={() => navigate('create')} className="mt-4 text-primary font-bold hover:underline">Create Now</button>
                </div>
            ) : (
                sets.filter(s => s.category === 'personal').map(set => (
                    <SetCard key={set.id} set={set} onClick={() => handleSetClick(set)} />
                ))
            )}
        </div>
    </div>
  );

  const renderCreate = () => (
    <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Resource</h1>
        
        {/* Toggle Mode */}
        <div className="flex p-1 bg-slate-200 rounded-xl w-fit mb-8">
            <button 
                onClick={() => setCreationMode('ai')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'ai' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                ✨ AI Generate
            </button>
            <button 
                onClick={() => setCreationMode('manual')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${creationMode === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <PenTool size={14} className="inline mr-2" />
                Manual Create
            </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            {/* Resource Type Selection */}
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                <button 
                    onClick={() => setCreateType('flashcard')} 
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${createType === 'flashcard' ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                    <Layers size={18} className="inline mr-2 mb-1" /> Flashcards
                </button>
                <button 
                    onClick={() => setCreateType('note')} 
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${createType === 'note' ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                    <FileText size={18} className="inline mr-2 mb-1" /> Note
                </button>
                {creationMode === 'ai' && (
                    <button 
                        onClick={() => setCreateType('podcast')} 
                        className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${createType === 'podcast' ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                        <Mic size={18} className="inline mr-2 mb-1" /> Podcast
                    </button>
                )}
            </div>

            {/* Content Area Based on Mode */}
            {creationMode === 'ai' ? (
                <>
                    <label className="block text-sm font-bold text-slate-600 mb-2">Input Content (Text or Image)</label>
                    <textarea 
                        className="w-full h-40 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none resize-none transition-all mb-4 text-sm"
                        placeholder="Paste lecture notes, essay text, or summary..."
                        value={createInput}
                        onChange={(e) => setCreateInput(e.target.value)}
                    />
                    
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative mb-6">
                        <input 
                            type="file" 
                            accept="image/*, .txt, .md"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="mx-auto text-slate-400 mb-2" />
                        <p className="text-sm font-bold text-slate-600">
                            {selectedFile ? selectedFile.name : "Upload Image or Text File"}
                        </p>
                    </div>

                    <button 
                        onClick={handleAICreate}
                        disabled={isGenerating || (!createInput && !selectedFile)}
                        className={`w-full py-3 rounded-xl font-bold text-white transition-all ${isGenerating ? 'bg-slate-300' : 'bg-primary hover:bg-blue-700'}`}
                    >
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                </>
            ) : (
                <>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-600 mb-2">Title</label>
                        <input 
                            type="text"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            placeholder="e.g., Unit 1 Key Terms"
                            className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary"
                        />
                    </div>

                    {createType === 'flashcard' ? (
                        <div className="space-y-4">
                            {manualCards.map((card, idx) => (
                                <div key={card.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <input 
                                                className="w-full bg-transparent border-b border-slate-300 focus:border-primary outline-none py-1 font-semibold text-slate-700 placeholder-slate-400"
                                                placeholder="Term"
                                                value={card.term}
                                                onChange={(e) => handleUpdateManualCard(idx, 'term', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input 
                                                className="w-full bg-transparent border-b border-slate-300 focus:border-primary outline-none py-1 text-slate-600 placeholder-slate-400"
                                                placeholder="Definition"
                                                value={card.definition}
                                                onChange={(e) => handleUpdateManualCard(idx, 'definition', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteManualCard(idx)}
                                        className="absolute -right-2 -top-2 bg-white text-red-500 p-1 rounded-full shadow border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={handleAddManualCard}
                                className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl font-bold hover:border-primary hover:text-primary transition-all"
                            >
                                + Add Card
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Note Content</label>
                            <textarea 
                                className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none resize-none"
                                placeholder="Type your notes here..."
                                value={createInput}
                                onChange={(e) => setCreateInput(e.target.value)}
                            />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleManualSubmit}
                        className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-black transition-all"
                    >
                        Save {createType === 'flashcard' ? 'Set' : 'Note'}
                    </button>
                </>
            )}
        </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Public Library</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.filter(s => s.category === 'public').map(set => (
                <SetCard key={set.id} set={set} onClick={() => handleSetClick(set)} />
            ))}
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-slate-800">
        {/* Sidebar */}
        <nav className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col items-center md:items-stretch py-8 sticky top-0 h-screen z-10 shadow-sm">
            <div className="mb-12 px-6 flex items-center gap-3 justify-center md:justify-start">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-xl">C</div>
                <span className="hidden md:block font-bold text-lg text-slate-800">Psych AI</span>
            </div>

            <div className="space-y-1 px-3 flex-1">
                <NavButton icon={<Home size={20} />} label="Home" active={view === 'dashboard'} onClick={() => navigate('dashboard')} />
                <NavButton icon={<BookOpen size={20} />} label="Curriculum" active={view === 'curriculum'} onClick={() => navigate('curriculum')} />
                <NavButton icon={<Layers size={20} />} label="Library" active={view === 'library'} onClick={() => navigate('library')} />
                <NavButton icon={<PlusCircle size={20} />} label="Create" active={view === 'create'} onClick={() => navigate('create')} />
            </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
            {view === 'dashboard' && renderDashboard()}
            {view === 'create' && renderCreate()}
            {view === 'curriculum' && <CreatorZone sets={sets} onSelect={handleSetClick} />}
            {view === 'library' && renderLibrary()}
            
            {view === 'study' && activeSet && (
                activeSet.type === 'podcast' && activeSet.audioUrl ? (
                    <div className="p-8 max-w-2xl mx-auto text-center">
                         <button onClick={() => navigate('dashboard')} className="mb-8 text-slate-400 hover:text-slate-800 font-bold flex items-center gap-2">
                             &larr; Back
                        </button>
                        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200">
                            <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                                <Mic size={48} />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-slate-800">{activeSet.title}</h2>
                            <p className="text-slate-500 mb-8">{activeSet.description}</p>
                            <audio controls src={activeSet.audioUrl} className="w-full" autoPlay />
                        </div>
                    </div>
                ) : activeSet.type === 'video' && activeSet.videoUrl ? (
                     <div className="p-8 max-w-4xl mx-auto">
                        <button onClick={() => navigate('dashboard')} className="mb-4 text-slate-400 hover:text-slate-800 font-bold flex items-center gap-2">
                             &larr; Back
                        </button>
                        <div className="bg-black rounded-xl overflow-hidden shadow-xl aspect-video">
                            <iframe 
                                className="w-full h-full"
                                src={activeSet.videoUrl.replace('watch?v=', 'embed/')} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            ></iframe>
                        </div>
                        <h1 className="text-2xl font-bold mt-6 text-slate-900">{activeSet.title}</h1>
                        <p className="text-slate-600 mt-2">{activeSet.description}</p>
                        <div className="mt-4 inline-block bg-blue-100 text-primary px-3 py-1 rounded-full text-xs font-bold">
                            {activeSet.unit || 'General'}
                        </div>
                     </div>
                ) : activeSet.type === 'flashcard' && activeSet.cards ? (
                    <StudyViewer set={activeSet} onBack={() => navigate('dashboard')} />
                ) : (
                    <div className="p-8 max-w-3xl mx-auto">
                        <button onClick={() => navigate('dashboard')} className="mb-6 text-slate-400 hover:text-slate-800 font-bold flex items-center gap-2">
                            &larr; Back
                        </button>
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="font-bold text-2xl text-slate-900">{activeSet.title}</h2>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 block">{activeSet.unit || 'Note'}</span>
                            <div className="prose prose-slate max-w-none">
                                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{activeSet.content}</p>
                            </div>
                        </div>
                    </div>
                )
            )}
        </main>
    </div>
  );
};

// --- SUB COMPONENTS ---

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all font-medium mb-1 ${active ? 'bg-blue-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
    >
        <div className={active ? 'text-primary' : 'text-slate-400'}>{icon}</div>
        <span className="hidden md:block">{label}</span>
    </button>
);

const SetCard: React.FC<{ set: StudySet, onClick: () => void }> = ({ set, onClick }) => {
    let Icon = FileText;
    let colorClass = "text-slate-500";
    let bgClass = "bg-slate-100";

    switch(set.type) {
        case 'video': Icon = Video; colorClass = "text-red-500"; bgClass = "bg-red-50"; break;
        case 'podcast': Icon = Mic; colorClass = "text-purple-500"; bgClass = "bg-purple-50"; break;
        case 'flashcard': Icon = Layers; colorClass = "text-blue-500"; bgClass = "bg-blue-50"; break;
        default: Icon = FileText; colorClass = "text-green-500"; bgClass = "bg-green-50"; break;
    }

    return (
        <div onClick={onClick} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${bgClass} ${colorClass}`}>
                    <Icon size={18} />
                </div>
                {set.category === 'creator' && <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">OFFICIAL</span>}
                {set.category === 'public' && <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">PUBLIC</span>}
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1 truncate">{set.title}</h3>
            <p className="text-slate-400 text-xs line-clamp-2 h-8 leading-relaxed">{set.description}</p>
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>{set.cards ? `${set.cards.length} Cards` : set.type}</span>
                <span className="group-hover:text-primary transition-colors">Open</span>
            </div>
        </div>
    );
};

export default App;