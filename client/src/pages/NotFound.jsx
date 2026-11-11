import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center items-center py-20 px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
          <Compass className="w-8 h-8" />
        </div>

        <div>
          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">
            Error 404
          </span>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">Page not found</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The page you're looking for doesn't exist or has moved to a new route.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/">
            <Button variant="primary" className="gap-2">
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2 cursor-pointer text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}