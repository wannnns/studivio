import React, { useState, useEffect, useMemo } from 'react';
import { Flashcard, StudySet, LearnModeQuestion } from '../types';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Brain, Layers } from 'lucide-react';

interface StudyViewerProps {
  set: StudySet;
  onBack: () => void;
}

const StudyViewer: React.FC<StudyViewerProps> = ({ set, onBack }) => {
  const [mode, setMode] = useState<'flip' | 'learn'>('flip');

  if (!set.cards || set.cards.length === 0) {
    return <div className="p-8 text-center">No flashcards in this set!</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <button onClick={onBack} className="text-stone-500 hover:text-stone-800 font-bold flex items-center gap-2">
          <ArrowLeft size={20} /> Back
        </button>
        
        <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
                onClick={() => setMode('flip')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'flip' ? 'bg-white shadow text-primary' : 'text-stone-500'}`}
            >
                <Layers size={16} className="inline mr-2" />
                Flip Mode
            </button>
            <button 
                onClick={() => setMode('learn')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'learn' ? 'bg-white shadow text-secondary' : 'text-stone-500'}`}
            >
                <Brain size={16} className="inline mr-2" />
                Learn Mode
            </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        {mode === 'flip' ? (
            <FlipMode cards={set.cards} />
        ) : (
            <LearnMode cards={set.cards} />
        )}
      </div>
    </div>
  );
};

// --- Flip Mode Sub-Component ---
const FlipMode: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
        }, 200);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        }, 200);
    };

    const currentCard = cards[currentIndex];

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            <div className="text-stone-400 font-bold mb-4 tracking-wider">
                CARD {currentIndex + 1} / {cards.length}
            </div>

            <div 
                className={`flip-card w-full h-80 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className="flip-card-inner relative w-full h-full duration-500">
                    {/* Front */}
                    <div className="flip-card-front absolute bg-white rounded-3xl shadow-lg border-b-4 border-stone-200 flex items-center justify-center p-8 text-center">
                        <h3 className="text-2xl font-bold text-stone-800">{currentCard.term}</h3>
                        <p className="absolute bottom-4 text-stone-300 text-sm font-bold">Tap to flip</p>
                    </div>
                    {/* Back */}
                    <div className="flip-card-back absolute bg-primary/5 rounded-3xl shadow-lg border-b-4 border-primary/20 flex items-center justify-center p-8 text-center">
                        <p className="text-xl text-stone-700 leading-relaxed">{currentCard.definition}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                <button onClick={handlePrev} className="p-4 rounded-full bg-white shadow-sm border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <button onClick={handleNext} className="p-4 rounded-full bg-primary text-white shadow-lg hover:bg-violet-600 shadow-violet-200 transition-all transform hover:scale-105">
                    <ArrowRight size={24} />
                </button>
            </div>
        </div>
    );
};

// --- Learn Mode Sub-Component ---
const LearnMode: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
    const [questions, setQuestions] = useState<LearnModeQuestion[]>([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Initialize Questions
    useEffect(() => {
        if (cards.length < 2) return; // Need at least 2 cards for distractors

        const generatedQuestions: LearnModeQuestion[] = cards.map((card) => {
            // Get distractors
            const otherCards = cards.filter(c => c.id !== card.id);
            // Shuffle others and take up to 3
            const distractors = otherCards.sort(() => 0.5 - Math.random()).slice(0, 3).map(c => c.definition);
            
            const options = [...distractors, card.definition].sort(() => 0.5 - Math.random());
            
            return {
                cardId: card.id,
                term: card.term,
                correctDefinition: card.definition,
                options
            };
        });

        // Shuffle question order
        setQuestions(generatedQuestions.sort(() => 0.5 - Math.random()));
        setCurrentQIndex(0);
        setScore(0);
        setIsFinished(false);
        setSelectedOption(null);
    }, [cards]);

    const handleAnswer = (option: string) => {
        if (selectedOption) return; // Prevent double click
        setSelectedOption(option);

        const isCorrect = option === questions[currentQIndex].correctDefinition;
        if (isCorrect) setScore(s => s + 1);

        setTimeout(() => {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                setIsFinished(true);
            }
        }, 1500);
    };

    if (cards.length < 4) {
        return (
            <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-dashed border-stone-300">
                <p className="text-lg text-stone-500">Not enough cards for Learn Mode! <br/>Add at least 4 flashcards to generate multiple choice questions.</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="text-center animate-fade-in py-12">
                <div className="inline-block p-6 bg-green-100 text-green-600 rounded-full mb-6">
                    <Brain size={48} />
                </div>
                <h2 className="text-3xl font-bold text-stone-800 mb-2">Great Job!</h2>
                <p className="text-xl text-stone-600 mb-8">You scored {score} out of {questions.length}</p>
                <button 
                    onClick={() => {
                        // Reshuffle logic trigger
                        const shuffled = [...questions].sort(() => 0.5 - Math.random());
                        setQuestions(shuffled);
                        setCurrentQIndex(0);
                        setScore(0);
                        setIsFinished(false);
                        setSelectedOption(null);
                    }}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                    <RotateCcw className="inline mr-2" size={20} />
                    Review Again
                </button>
            </div>
        );
    }

    if (questions.length === 0) return <div>Loading...</div>;

    const currentQ = questions[currentQIndex];

    return (
        <div className="w-full max-w-2xl mx-auto">
             <div className="mb-6 flex justify-between items-center text-sm font-bold text-stone-400 uppercase tracking-wider">
                <span>Question {currentQIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-stone-100 mb-6 text-center">
                <h3 className="text-2xl font-bold text-stone-800">{currentQ.term}</h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {currentQ.options.map((option, idx) => {
                    let statusClass = "bg-white border-stone-200 hover:border-primary hover:bg-primary/5 text-stone-600";
                    
                    if (selectedOption) {
                        if (option === currentQ.correctDefinition) {
                            statusClass = "bg-green-100 border-green-400 text-green-800";
                        } else if (option === selectedOption) {
                            statusClass = "bg-red-100 border-red-400 text-red-800";
                        } else {
                            statusClass = "bg-stone-50 border-stone-100 text-stone-400 opacity-50";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            disabled={!!selectedOption}
                            onClick={() => handleAnswer(option)}
                            className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${statusClass}`}
                        >
                            <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {selectedOption && option === currentQ.correctDefinition && <CheckCircle size={20} className="text-green-600" />}
                                {selectedOption && option === selectedOption && option !== currentQ.correctDefinition && <XCircle size={20} className="text-red-600" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default StudyViewer;
