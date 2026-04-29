import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, RotateCcw, Check, ChevronRight, Loader } from 'lucide-react';
import { useUIStore, useSchoolStore, useTimetableStore } from '../../store';
import { processAICommand } from '../../services/aiService';
import { AI_PROMPTS } from '../../data/demoData';
import { clsx } from 'clsx';

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export function AIChat() {
  const { aiChatOpen, closeAIChat, addToast } = useUIStore();
  const { teachers, subjects, classes, rooms } = useSchoolStore();
  const { periods, undo, addPeriod, bulkSetPeriods } = useTimetableStore();

  const [messages, setMessages] = useState([
    {
      id: 1, role: 'ai',
      text: '👋 Hi! I\'m your **EduSchedule AI** assistant. I can help you:\n\n• Schedule & manage periods\n• Detect & resolve conflicts\n• Find substitutes\n• Optimize workloads\n• Analyze your timetable\n\nWhat would you like to do?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (aiChatOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [aiChatOpen]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || isTyping) return;
    setInput('');
    setMessages(m => [...m, { id: Date.now(), role: 'user', text: msg }]);
    setIsTyping(true);

    try {
      const result = await processAICommand(msg, { teachers, subjects, classes, rooms, periods });
      setIsTyping(false);
      const aiMsg = { id: Date.now() + 1, role: 'ai', text: result.text, action: result.action, requiresConfirmation: result.requiresConfirmation, confirmText: result.confirmText };
      setMessages(m => [...m, aiMsg]);
      if (result.requiresConfirmation) setPendingAction({ ...result.action, msgId: aiMsg.id });
      else if (result.action) executeAction(result.action);
    } catch {
      setIsTyping(false);
      setMessages(m => [...m, { id: Date.now() + 1, role: 'ai', text: '⚠️ Something went wrong. Please try again.' }]);
    }
  };

  const executeAction = (action) => {
    if (!action) return;
    if (action.type === 'undo') { undo(); addToast({ type: 'success', message: 'Action undone' }); }
    else if (action.type === 'bulk_add_periods' && action.periods) {
      action.periods.forEach(p => addPeriod(p));
      addToast({ type: 'success', title: 'Periods Added', message: `${action.periods.length} periods scheduled` });
    } else if (action.type === 'open_conflict_panel') {
      useUIStore.getState().toggleConflictPanel();
    } else if (action.type === 'generate_timetable') {
      addToast({ type: 'info', message: 'Use the Generate button on the Timetable page' });
    }
  };

  const confirmAction = () => {
    if (pendingAction) { executeAction(pendingAction); setPendingAction(null); }
  };
  const cancelAction = () => setPendingAction(null);

  const clearChat = () => {
    setMessages([{ id: 1, role: 'ai', text: '👋 Chat cleared! How can I help you?' }]);
    setPendingAction(null);
  };

  if (!aiChatOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 h-[560px] flex flex-col glass shadow-glass animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">AI Assistant</p>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Online · Mock NLI Engine
          </p>
        </div>
        <button onClick={clearChat} className="btn-icon text-slate-400" title="Clear chat"><RotateCcw size={14} /></button>
        <button onClick={closeAIChat} className="btn-icon text-slate-400"><X size={16} /></button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Sparkles size={10} className="text-white" />
              </div>
            )}
            <div className={clsx('chat-bubble', msg.role)}>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
              {msg.requiresConfirmation && pendingAction?.msgId === msg.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  <button onClick={cancelAction} className="btn-secondary text-xs py-1 flex-1">Cancel</button>
                  <button onClick={confirmAction} className="btn-primary text-xs py-1 flex-1">
                    <Check size={12} /> Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles size={10} className="text-white" />
            </div>
            <div className="chat-bubble ai flex items-center gap-1.5 py-3">
              <div className="typing-dot" style={{ animationDelay: '0ms' }} />
              <div className="typing-dot" style={{ animationDelay: '150ms' }} />
              <div className="typing-dot" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {AI_PROMPTS.slice(0, 4).map((p, i) => (
            <button key={i} onClick={() => send(p)}
              className="shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-surface-800 border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-brand-500/30 transition-all whitespace-nowrap">
              {p.length > 28 ? p.slice(0, 28) + '…' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            className="input flex-1 text-sm"
            placeholder="Ask me anything about your timetable..."
            disabled={isTyping}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || isTyping}
            className={clsx('btn-primary px-3', (!input.trim() || isTyping) && 'opacity-50 cursor-not-allowed')}>
            {isTyping ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
