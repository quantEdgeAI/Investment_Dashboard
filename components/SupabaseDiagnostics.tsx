'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseDiagnostics() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: any[] = [];

    // Test 1: Check Supabase client initialization
    diagnostics.push({
      test: 'Supabase Client Initialization',
      status: supabase ? 'PASS' : 'FAIL',
      details: supabase ? 'Client initialized' : 'Client not initialized'
    });

    // Test 2: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    diagnostics.push({
      test: 'Environment Variables',
      status: (supabaseUrl && supabaseKey) ? 'PASS' : 'FAIL',
      details: `URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}, Key: ${supabaseKey ? '✓ Set' : '✗ Missing'}`
    });

    // Test 3: Test connection to each table
    const tables = ['Signals', 'Orders', 'Trades', 'Pnl'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          diagnostics.push({
            test: `Table: ${table}`,
            status: 'FAIL',
            details: `Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details || 'N/A'}\nHint: ${error.hint || 'N/A'}`
          });
        } else {
          diagnostics.push({
            test: `Table: ${table}`,
            status: 'PASS',
            details: `Accessible, Row count: ${count || 0}`
          });
        }
      } catch (err: any) {
        diagnostics.push({
          test: `Table: ${table}`,
          status: 'ERROR',
          details: `Exception: ${err.message}`
        });
      }
    }

    // Test 4: Network connectivity
    try {
      const response = await fetch('https://dtlylrntpvgzauqcbmfv.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        }
      });

      diagnostics.push({
        test: 'Network Connectivity',
        status: response.ok ? 'PASS' : 'WARN',
        details: `Status: ${response.status} ${response.statusText}`
      });
    } catch (err: any) {
      diagnostics.push({
        test: 'Network Connectivity',
        status: 'FAIL',
        details: `Error: ${err.message}`
      });
    }

    // Test 5: Check RLS policies
    try {
      const { data, error } = await supabase
        .from('Signals')
        .select('*')
        .limit(1);

      diagnostics.push({
        test: 'Row Level Security (RLS)',
        status: error ? 'FAIL' : 'PASS',
        details: error 
          ? `RLS may be blocking access: ${error.message}` 
          : 'RLS allows read access'
      });
    } catch (err: any) {
      diagnostics.push({
        test: 'Row Level Security (RLS)',
        status: 'ERROR',
        details: `Exception: ${err.message}`
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Diagnostics</h2>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 mb-4"
      >
        {loading ? 'Running...' : 'Run Diagnostics'}
      </button>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                result.status === 'PASS'
                  ? 'bg-green-500/10 border-green-500/30'
                  : result.status === 'WARN'
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-bold ${
                  result.status === 'PASS' ? 'text-green-500' : 
                  result.status === 'WARN' ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {result.status}
                </span>
                <span className="font-medium">{result.test}</span>
              </div>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                {result.details}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
