"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, Zap, Brain, MessageSquare, History, Wand2, Terminal, Code2, LineChart, Cpu, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

const QUICK_TOOLS = [
  { label: "Lead Scorer", icon: Target, desc: "Analyze lead quality" },
  { label: "Email Reply", icon: Mail, desc: "Draft professional reply" },
  { label: "Deal Summary", icon: Briefcase, desc: "Summarize status" },
  { label: "Meeting Notes", icon: FileText, desc: "Format transcript" }
];

import { Target, Mail, Briefcase, FileText } from "lucide-react";

export default function AIAutomationPage() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    { role: "assistant", content: "Agent Nexus initialized. I'm ready to optimize your agency workflows. What shall we tackle first?" }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setChat(p => [...p, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setChat(p => [...p, { role: "assistant", content: "I've analyzed your request. Based on current pipeline data, we can automate the follow-up sequence for your High Priority deals in 'Negotiation' using the new Q1 template." }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 h-[calc(100vh-10rem)] pb-6 text-white">
      {/* Side Panel - Status & Tools */}
      <div className="xl:col-span-1 space-y-6 flex flex-col">
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                 <Brain size={20} />
              </div>
              <div>
                 <h2 className="text-sm font-bold">Agent Nexus v4.0</h2>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Neural Engine Active</p>
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase">
                 <span>System Load</span>
                 <span className="text-blue-400">Stable</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-[24%]" />
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase">
                 <span>Context Window</span>
                 <span className="text-zinc-400">128k</span>
              </div>
           </div>
        </div>

        <div className="flex-1 p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/60 space-y-4 overflow-y-auto">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Workflow Automations</h3>
           <div className="grid grid-cols-1 gap-3">
              {QUICK_TOOLS.map(tool => (
                <button key={tool.label} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/40 hover:border-blue-500/40 hover:bg-zinc-800/30 transition-all text-left group">
                   <div className="p-2 rounded-lg bg-zinc-800 text-zinc-500 group-hover:text-blue-400 transition-colors"><tool.icon size={16} /></div>
                   <div>
                      <p className="text-xs font-bold text-zinc-200">{tool.label}</p>
                      <p className="text-[9px] text-zinc-600">{tool.desc}</p>
                   </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="xl:col-span-3 flex flex-col rounded-3xl bg-zinc-900/50 border border-zinc-800/60 overflow-hidden relative">
         <div className="p-6 border-b border-zinc-800/60 flex justify-between items-center bg-zinc-950/20">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Live Integration Session</span>
            </div>
            <button className="text-zinc-600 hover:text-white"><History size={16} /></button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chat.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.98, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn("flex gap-4 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                 <div className={cn("w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center", msg.role === "assistant" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")}>
                    {msg.role === "assistant" ? <Sparkles size={16} /> : <User size={16} />}
                 </div>
                 <div className={cn("p-4 rounded-2xl text-sm leading-relaxed", msg.role === "assistant" ? "bg-zinc-800/50 text-zinc-200" : "bg-blue-600 text-white")}>
                    {msg.content}
                 </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center animate-pulse"><Sparkles size={16} /></div>
                 <div className="flex gap-1.5 items-center p-4">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                 </div>
              </div>
            )}
         </div>

         <div className="p-6 bg-zinc-950/30 border-t border-zinc-800/60">
            <div className="relative">
               <textarea 
                  rows={2}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask Nexus to automate a task, summarize a board, or draft an email..."
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none pr-16"
               />
               <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-3 bottom-3 p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
               >
                  <Send size={18} />
               </button>
            </div>
            <div className="flex gap-4 mt-3 ml-2">
               {["Draft Proposal", "Review Sprint", "Scan Leads"].map(suggestion => (
                 <button key={suggestion} onClick={() => setInput(suggestion)} className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase py-1 tracking-widest">
                    #{suggestion}
                 </button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
