export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Signals: {
        Row: {
          signalId: number
          symbol: string
          date: string
          open: number
          high: number
          low: number
          close: number
          st1: number
          st1_dir: number
          st2: number
          st2_dir: number
          adx: number
          plus_di: number
          minus_di: number
          lr_slope: number
          lr_accel: number
          both_st_bullish: number
          strong_trend: number
          rising_trend: number
          accelerating: number
          green_candle: number
          signal: string
          strategy: string
          profit_pct: number
          stop_loss_pct: number
          status: number
          [key: string]: any
        }
        Insert: {
          id?: number
          created_at?: string
          symbol: string
          signal_type: string
          price: number
          quantity: number
          timestamp?: string
          strategy?: string
          confidence?: number
          [key: string]: any
        }
        Update: {
          id?: number
          created_at?: string
          symbol?: string
          signal_type?: string
          price?: number
          quantity?: number
          timestamp?: string
          strategy?: string
          confidence?: number
          [key: string]: any
        }
      }
      Orders: {
        Row: {
          orderId: number
          date: string
          tradingsymbol: string
          instrument_token: number
          underlier_symbol: string
          side: string
          quantity: number
          strategy: string
          price: number
          stoploss_price: number
          target_price: number
          signalId: number
          timestamp: string
          [key: string]: any
        }
        Insert: {
          id?: number
          created_at?: string
          order_id: string
          symbol: string
          order_type: string
          side: string
          quantity: number
          price: number
          status?: string
          timestamp?: string
          filled_quantity?: number
          average_price?: number
          [key: string]: any
        }
        Update: {
          id?: number
          created_at?: string
          order_id?: string
          symbol?: string
          order_type?: string
          side?: string
          quantity?: number
          price?: number
          status?: string
          timestamp?: string
          filled_quantity?: number
          average_price?: number
          [key: string]: any
        }
      }
      Trades: {
        Row: {
          tradeId: number
          tradingsymbol: string
          instrument_token: number
          underlier_symbol: string
          price: number
          quantity: number
          date: string
          orderId: number
          side: string
          strategy: string
          [key: string]: any
        }
        Insert: {
          id?: number
          created_at?: string
          trade_id: string
          symbol: string
          side: string
          quantity: number
          entry_price: number
          exit_price?: number | null
          entry_time?: string
          exit_time?: string | null
          status?: string
          pnl?: number | null
          [key: string]: any
        }
        Update: {
          id?: number
          created_at?: string
          trade_id?: string
          symbol?: string
          side?: string
          quantity?: number
          entry_price?: number
          exit_price?: number | null
          entry_time?: string
          exit_time?: string | null
          status?: string
          pnl?: number | null
          [key: string]: any
        }
      }
      Pnl: {
        Row: {
          pnlId: number
          tradeid: number
          tradingsymbol: string
          underlier_symbol: string
          instrument_token: number
          buy_price: number
          sell_price: number
          buy_date: string
          sell_date: string
          comment: string
          delta: number
          strategy: string
          asset_class: string
          [key: string]: any
        }
        Insert: {
          id?: number
          created_at?: string
          date: string
          realized_pnl: number
          unrealized_pnl: number
          total_pnl: number
          portfolio_value: number
          trades_count?: number
          [key: string]: any
        }
        Update: {
          id?: number
          created_at?: string
          date?: string
          realized_pnl?: number
          unrealized_pnl?: number
          total_pnl?: number
          portfolio_value?: number
          trades_count?: number
          [key: string]: any
        }
      }
      OpenPositions: {
        Row: {
          orderid: number
          date: string
          tradingsymbol: string
          quantity: number
          side: string
          buy_price: number
          curr_price: number
          [key: string]: any
        }
        Insert: {
          orderid?: number
          date: string
          tradingsymbol: string
          quantity: number
          side: string
          buy_price: number
          curr_price: number
          [key: string]: any
        }
        Update: {
          orderid?: number
          date?: string
          tradingsymbol?: string
          quantity?: number
          side?: string
          buy_price?: number
          curr_price?: number
          [key: string]: any
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
