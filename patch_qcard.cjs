const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { Share2, Printer, Settings, BarChart2, MessageSquare, GraduationCap, Book, Star, Edit2, Play, Repeat, Search, CornerUpLeft, ArrowLeft, ArrowRight, CornerDownRight, Share } from 'lucide-react';
import type { SanitizedQuestion, OptionKey, SessionAnswerState } from '../types';

interface Props {
  question: SanitizedQuestion;
  questionNumber: number;
  totalQuestions: number;
  answerState?: SessionAnswerState;
  isBookmarked: boolean;
  needsReview: boolean;
  mode: 'study' | 'simulado';
  isFinished?: boolean;
  onSelectOption: (option: OptionKey) => void;
  onSubmitAnswer: (option: OptionKey) => void;
  onToggleBookmark: () => void;
  onToggleReview: () => void;
  onOpenReport: () => void;
  onDeleteQuestion?: (question: SanitizedQuestion) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  isSubmitting?: boolean;
  userId?: string;
  globalCorrect?: number;
  globalWrong?: number;
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D', 'E'];

export const QuestionCard: React.FC<Props> = ({
  question,
  questionNumber,
  totalQuestions,
  answerState,
  isBookmarked,
  needsReview,
  mode,
  isFinished = false,
  onSelectOption,
  onSubmitAnswer,
  onToggleBookmark,
  onToggleReview,
  onOpenReport,
  onDeleteQuestion,
  onNext,
  onPrev,
  hasPrev = false,
  hasNext = false,
  userId,
  isSubmitting = false,
  globalCorrect = 15,
  globalWrong = 2,
}) => {
  const [selectedOpt, setSelectedOpt] = useState<OptionKey | null>(
    (answerState?.selectedAnswer as OptionKey) || question.userAnswer || null
  );
  
  useEffect(() => {
    setSelectedOpt((answerState?.selectedAnswer as OptionKey) || question.userAnswer || null);
  }, [question.id, answerState?.selectedAnswer, question.userAnswer]);

  const isAnsweredInStudy = mode === 'study' && !!answerState?.selectedAnswer;
  const showFullResolution = isAnsweredInStudy || isFinished;
  const correctAnswer = answerState?.correctAnswer || question.answer;

  const handleOptionClick = (key: OptionKey) => {
    if (showFullResolution && mode === 'study') return;
    setSelectedOpt(key);
    onSelectOption(key);
    // Auto submit behavior similar to previous version, though Tec requires clicking responder? No, we auto submit on select for study mode for ease.
    if (!isSubmitting) {
        onSubmitAnswer(key);
    }
  };

  const totalResolvidas = globalCorrect + globalWrong;

  return (
    <div id={\`question-card-\${question.id}\`} className="bg-white rounded border border-[#e2e2e2] shadow-sm flex flex-col font-sans mb-10">
      
      {/* Tabs / Tools Header */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-[#e2e2e2] text-[#4ea1d3] text-sm">
        <div className="flex items-center gap-2 font-bold cursor-pointer border-b-2 border-[#4ea1d3] pb-3 -mb-3">
          <span className="w-4 h-4 rounded-full bg-[#4ea1d3] text-white flex items-center justify-center text-[10px]">Q</span>
          Questões
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <BarChart2 className="w-4 h-4" />
          Índice
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <BarChart2 className="w-4 h-4" /> {/* Actually it's a pie chart icon for Estatisticas */}
          Estatísticas
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <CheckCircle2 className="w-4 h-4" />
          Gabarito
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <Settings className="w-4 h-4" />
          Configurações
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <Printer className="w-4 h-4" />
          Imprimir
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#258bd5]">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </div>
      </div>

      {/* Main Question Info */}
      <div className="p-5 flex flex-col gap-4">
        
        {/* Info Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {/* Coat of arms placeholder */}
            <div className="w-12 h-14 bg-gray-100 border flex items-center justify-center rounded">
               <span className="text-xs text-gray-400">Logo</span>
            </div>
            <div className="flex flex-col text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#333333]">Questão {questionNumber} de {totalQuestions}</span>
                <span className="text-[11px] text-[#777777]">({totalResolvidas} Resolvidas, <span className="text-[#5cb85c]">{globalCorrect} Acertos</span> e <span className="text-[#d9534f]">{globalWrong} Erros</span>)</span>
                <XCircle className="w-3.5 h-3.5 text-red-500 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1 mt-1 text-[13px]">
                <span className="text-[#777777]">Matéria:</span>
                <span className="text-[#4ea1d3] cursor-pointer hover:underline">{question.volume}</span>
              </div>
              <div className="flex items-center gap-1 text-[13px]">
                <span className="text-[#777777]">Assunto:</span>
                <span className="text-[#4ea1d3] cursor-pointer hover:underline">{question.topic}{question.subtopic ? \` > \${question.subtopic}\` : ''}</span>
                <XCircle className="w-3 h-3 text-red-500 cursor-pointer ml-1" />
              </div>
            </div>
          </div>
          
          {/* Action Icons right */}
          <div className="flex items-center gap-3 text-gray-500">
            <GraduationCap className="w-6 h-6 hover:text-gray-800 cursor-pointer" />
            <Book className="w-5 h-5 text-red-500 hover:text-red-700 cursor-pointer fill-red-500" />
            <div className="relative cursor-pointer">
              <MessageSquare className="w-5 h-5 text-blue-500 fill-blue-500 hover:text-blue-700" />
              <span className="absolute -bottom-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1 rounded-sm">1</span>
            </div>
            <Star className={\`w-6 h-6 cursor-pointer \${isBookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400 hover:fill-yellow-400'}\`} onClick={onToggleBookmark} />
            <Edit2 className="w-5 h-5 text-purple-500 hover:text-purple-700 cursor-pointer" />
            <div className="w-5 h-5 border-[3px] border-teal-400 rounded-full cursor-pointer"></div>
            <div className="flex flex-col gap-[3px] cursor-pointer px-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Source ID bar */}
        <div className="flex items-center justify-between bg-[#f9f9f9] border border-[#e2e2e2] px-3 py-2 rounded text-[13px]">
          <div className="flex items-center gap-2">
            <Share className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[#4ea1d3] font-bold">#{question.id.substring(0,8)}</span>
            <span className="text-[#333333] font-bold uppercase">{question.caderno || 'INSTITUTO MAIS - 2023'}</span>
            <XCircle className="w-3.5 h-3.5 text-red-500 cursor-pointer" />
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
              <CornerUpLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={onPrev} disabled={!hasPrev} className="p-1 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button onClick={onNext} disabled={!hasNext} className="p-1 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
              <ArrowRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Statement */}
        <div className="text-[15px] leading-[1.6] text-[#333] whitespace-pre-wrap mt-2">
          {question.statement}
        </div>

        {/* Alternatives */}
        <div className="flex flex-col gap-1 mt-4">
          {OPTION_KEYS.map((key) => {
            const optText = question.options[key];
            if (!optText) return null;

            let isCorrect = false;
            let isWrong = false;
            if (showFullResolution) {
              if (key === correctAnswer) isCorrect = true;
              else if (key === selectedOpt) isWrong = true;
            } else {
               if (key === selectedOpt) {
                   // if we selected it but it's not checked yet, we just highlight as selected. But here we auto submit, so showFullResolution is true.
               }
            }

            let bgClass = "bg-[#f9f9f9]";
            let textClass = "text-[#333]";
            
            if (isCorrect) {
              bgClass = "bg-[#d4edda]";
            } else if (isWrong) {
              bgClass = "bg-[#f8d7da]";
            }

            return (
              <div
                key={key}
                onClick={() => handleOptionClick(key)}
                className={\`flex items-start gap-3 p-2.5 cursor-pointer transition-colors \${bgClass} hover:bg-opacity-80\`}
              >
                <div className={\`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-xs \${
                  isCorrect ? 'border-[#4ea1d3] bg-[#4ea1d3] text-white' : 
                  (selectedOpt === key && !showFullResolution) ? 'border-[#4ea1d3] bg-[#4ea1d3] text-white' :
                  'border-gray-300 bg-white text-gray-600'
                }\`}>
                  {key}
                </div>
                <div className={\`text-[14px] pt-[2px] \${textClass}\`}>
                  {optText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback Message */}
        {showFullResolution && answerState && (
          <div className="flex items-center gap-2 mt-4 text-[14px]">
            {answerState.isCorrect ? (
              <>
                <div className="w-5 h-5 rounded-full bg-[#5cb85c] text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[#5cb85c] font-bold">Você acertou!</span>
                <span className="text-[#333]">Muito bem!</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-[#d9534f] text-white flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <span className="text-[#d9534f] font-bold">Você errou!</span>
              </>
            )}
            <span className="text-[#4ea1d3] cursor-pointer hover:underline ml-1">Ver resolução</span>
          </div>
        )}

      </div>
      
      {/* Bottom Tool Bar */}
      <div className="px-5 pb-5 pt-0 flex gap-2">
        <button onClick={onPrev} disabled={!hasPrev} className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={onNext} disabled={!hasNext} className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
          <ArrowRight className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <Shuffle className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <CornerDownRight className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <Play className="w-4 h-4 text-gray-600 fill-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <Repeat className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <Star className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-1.5 border border-[#e2e2e2] rounded bg-white hover:bg-gray-50 cursor-pointer">
          <Edit2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

    </div>
  );
};
`;

fs.writeFileSync('src/components/QuestionCard.tsx', content, 'utf8');
console.log('QuestionCard updated');
