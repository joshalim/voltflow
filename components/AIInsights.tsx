
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { EVTransaction, Language } from '../types';
import { getAIAnalysis } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';

interface AIInsightsProps {
  transactions: EVTransaction[];
  lang: Language;
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions, lang }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = (key: string) => TRANSLATIONS[key]?.[lang] || key;

  const fetchAnalysis = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    try {
      const result = await getAIAnalysis(transactions);
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Error generating insights.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactions.length > 0 && !analysis) fetchAnalysis();
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <BrainCircuit size={48} className="text-slate-200 mb-4" />
        <p className="text-slate-400 font-bold">Import transactions to unlock AI insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-black text-slate-800">{t('aiInsights')}</h2>
            <Sparkles size={20} className="text-orange-500" />
          </div>
          <p className="text-slate-500 font-medium">Smart Charge infrastructure analysis via Gemini.</p>
        </div>
        <button 
          onClick={fetchAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-50 transition shadow-lg shadow-orange-100"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          {loading ? 'Analyzing...' : 'Refresh AI'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-orange-500"><BrainCircuit size={120} /></div>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 w-1/4 bg-slate-100 rounded"></div>
                <div className="h-4 w-full bg-slate-50 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-50 rounded"></div>
                <div className="h-40 bg-slate-50 rounded-2xl mt-8"></div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm">
                {analysis ? analysis.split('\n').map((line, i) => (
                  <p key={i} className={line.includes('**') ? 'font-black text-slate-900 mt-4' : ''}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                )) : "Click Refresh to see AI-driven suggestions."}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <InsightSmallCard title="Revenue Growth" desc="Switching Corporate-A accounts to dynamic night rates could boost margin by 12%." icon={<TrendingUp className="text-emerald-500" />} color="emerald" />
          <InsightSmallCard title="Efficiency Alert" desc="Some Type 2 connectors are reporting idle times over 45% during peak hours." icon={<AlertTriangle className="text-orange-500" />} color="orange" />
          <InsightSmallCard title="Strategy Tip" desc="Expand DC Fast infrastructure at Riverside Mall based on current SUV charging trends." icon={<Lightbulb className="text-blue-500" />} color="blue" />
        </div>
      </div>
    </div>
  );
};

const InsightSmallCard = ({ title, desc, icon, color }: any) => (
  <div className={`p-6 rounded-3xl border shadow-sm ${
    color === 'emerald' ? 'bg-emerald-50 border-emerald-100' : 
    color === 'orange' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
  }`}>
    <div className="flex items-center gap-3 mb-2">
      {icon} <h4 className="font-black text-slate-800 text-sm">{title}</h4>
    </div>
    <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default AIInsights;
