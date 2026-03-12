import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Filter, 
  MoreHorizontal,
  Home,
  BarChart2,
  Settings,
  User,
  Coffee,
  ShoppingBag,
  Zap,
  Briefcase,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Lock
} from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameYear, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oiwlqwwecyeupnlefqtx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pd2xxd3dlY3lldXBubGVmcXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjg4NDYsImV4cCI6MjA4ODg0NDg0Nn0.2e6Gy6X7OqIZbhEUkLFcxVyDMXmiVGHK63JF0e6lTFw'
);

import './App.css';
import logo from './assets/logo.png';

const ITEMS_PER_PAGE = 6;

// Utility for COP Formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (value) => {
  if (!value) return '';
  return new Intl.NumberFormat('es-CO').format(value);
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'stats'
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null); // Filter by day
  const [currentPage, setCurrentPage] = useState(1);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch transactions from Supabase
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTransactions();
    }
  }, [isAuthenticated, user]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data.map(t => ({
        ...t,
        date: new Date(t.created_at),
        icon: t.type === 'income' ? <Plus size={20} /> : <ShoppingBag size={20} />
      })));
    }
    setLoading(false);
  };

  // Derived Values
  const totals = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = totals.income - totals.expense;

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }
    if (selectedDate) {
      result = result.filter(t => isSameDay(t.date, selectedDate));
    }
    return result.sort((a, b) => b.date - a.date);
  }, [transactions, filterType, selectedDate]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const handleAddTransaction = async (newTx) => {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        user_email: user.email,
        title: newTx.title,
        amount: newTx.amount,
        type: newTx.type,
        category: newTx.category
      }]);

    if (error) {
      alert('Error al guardar en Supabase: ' + error.message);
    } else {
      fetchTransactions();
      setShowAddModal(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        fetchTransactions();
      }
    }
  };

  const clearAllData = async () => {
    if (window.confirm('¿ELIMINAR TODO? Esta acción no se puede deshacer y borrará todos tus registros históricos.')) {
      setLoading(true);
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_email', user.email);

      if (error) {
        alert('Error al limpiar datos: ' + error.message);
      } else {
        fetchTransactions();
        alert('Todos los datos han sido eliminados.');
      }
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setFilterType('all');
    setCurrentPage(1);
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={(userData) => { setIsAuthenticated(true); setUser(userData); }} />;
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setTransactions([]);
  };

  return (
    <div className="main-container">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <header className="app-header">
        <div className="header-actions left">
          <button className="icon-btn-ghost" onClick={handleLogout} title="Cerrar Sesión">
            <X size={20} />
          </button>
        </div>
        <div className="logo-container centered">
          <img src={logo} alt="GoCoink" className="app-logo-header" />
        </div>
        <div className="header-actions right">
          <button className="icon-btn-ghost" title="Usuario">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Old drawer location removed */}

      <main className="app-content">
        {view === 'home' ? (
          <>
            {/* Balance Card */}
            <motion.div className="balance-card">
            <div className="card-main-row">
              <div className="balance-label-group">
                <span className="balance-label">Balance Total</span>
                <User size={18} />
              </div>
              <h2 className="balance-amount">{formatCurrency(balance)}</h2>
            </div>
              <div className="card-stats">
                <div className="stat-item">
                  <div className="stat-icon income-bg"><ArrowUpRight size={14} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Ingresos</span>
                    <span className="stat-value">{formatCurrency(totals.income)}</span>
                  </div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-icon expense-bg"><ArrowDownRight size={14} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Gastos</span>
                    <span className="stat-value">{formatCurrency(totals.expense)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filter Section */}
            <section className="section-container">
              <div className="section-header">
                <h3>Movimientos</h3>
                {selectedDate && (
                  <span className="current-filter" onClick={clearFilters}>
                    {format(selectedDate, 'dd MMM', { locale: es })} <X size={12} />
                  </span>
                )}
              </div>
              <div className="filter-bar">
                <div className="tabs">
                  {['all', 'income', 'expense'].map((t) => (
                    <button 
                      key={t}
                      className={`tab-btn ${filterType === t ? 'active' : ''}`}
                      onClick={() => { setFilterType(t); setCurrentPage(1); }}
                    >
                      {t === 'all' ? 'Ver Todo' : t === 'income' ? 'Ingresos' : 'Gastos'}
                    </button>
                  ))}
                </div>
                
                <button 
                  className={`calendar-btn-inline ${selectedDate ? 'active' : ''}`}
                  onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                  aria-label="Abrir calendario"
                >
                  <Calendar size={20} />
                  {selectedDate && <div className="active-dot" />}
                </button>
                <AnimatePresence>
                  {showCalendarPicker && (
                    <motion.div 
                      className="calendar-drawer glass"
                      initial={{ opacity: 0, scale: 0.9, y: -10, x: "-50%" }}
                      animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                      exit={{ opacity: 0, scale: 0.9, y: -10, x: "-50%" }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.2 }}
                    >
                      <div className="calendar-header">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="page-btn-mini">
                          <ChevronLeft size={16} />
                        </button>
                        <h4>{format(currentMonth, 'MMMM yyyy', { locale: es })}</h4>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="page-btn-mini">
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="calendar-grid">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                          <div key={day} className="weekday-label">{day}</div>
                        ))}
                        {eachDayOfInterval({
                          start: startOfWeek(startOfMonth(currentMonth)),
                          end: endOfWeek(endOfMonth(currentMonth))
                        }).map((day, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedDate(day);
                              setShowCalendarPicker(false);
                              setCurrentPage(1);
                            }}
                            className={`calendar-day ${
                              !isSameMonth(day, currentMonth) ? 'outside' : ''
                            } ${
                              selectedDate && isSameDay(day, selectedDate) ? 'active' : ''
                            } ${
                              isSameDay(day, new Date()) ? 'today' : ''
                            }`}
                          >
                            {format(day, 'd')}
                          </button>
                        ))}
                      </div>

                      <div className="calendar-footer">
                        <button 
                          className="clear-date-btn"
                          onClick={() => {
                            setSelectedDate(null);
                            setShowCalendarPicker(false);
                            setCurrentPage(1);
                          }}
                        >
                          Ver todos los movimientos
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Transaction List */}
            <section className="transactions-list">
              <AnimatePresence mode="popLayout">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((tx) => (
                    <motion.div 
                      key={tx.id}
                      className="transaction-item"
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <div className={`tx-icon-box ${tx.type}`}>
                        {tx.icon}
                      </div>
                      <div className="tx-details">
                        <span className="tx-title">{tx.title}</span>
                        <span className="tx-date">{format(tx.date, 'dd MMM, p', { locale: es })}</span>
                      </div>
                      <div className={`tx-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                      <button 
                        className="tx-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(tx.id);
                        }}
                        aria-label="Eliminar transacción"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No hay movimientos para esta fecha.</p>
                    <button onClick={clearFilters} className="clear-link">Limpiar filtros</button>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Content gap */}
            <div style={{ height: 20 }}></div>
          </>
        ) : (
          <StatisticsView 
            transactions={transactions} 
          />
        )}
      </main>

      {/* Bottom Sticky Area */}
      <div className="action-bar-container flex-column">
        {/* Pagination anchored above footer */}
        {view === 'home' && totalPages > 1 && (
          <div className="pagination glass-mini">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="page-btn-mini"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="page-info-mini">Página {currentPage} de {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="page-btn-mini"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
        
        <nav className="bottom-nav">
          <button 
            className={`nav-item ${view === 'home' ? 'active' : ''}`} 
            onClick={() => setView('home')}
          >
            <Home size={24} />
            <span>Inicio</span>
          </button>
          
          <div className="fab-wrapper">
            <button 
              className="fab-main"
              onClick={() => setShowAddModal(true)}
            >
              <div className="fab-glow"></div>
              <Plus size={32} color="white" />
            </button>
          </div>

          <button 
            className={`nav-item ${view === 'stats' ? 'active' : ''}`}
            onClick={() => setView('stats')}
          >
            <BarChart2 size={24} />
            <span>Estadísticas</span>
          </button>
        </nav>
        
        <div className="footer-credit">
          Diseñado por <strong>MOUSELAB</strong>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div 
              className="add-modal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <div className="modal-header">
                <h3>Nuevo Registro</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowAddModal(false)}
                  aria-label="Cerrar modal"
                >
                  <X size={20} />
                </button>
              </div>
              <AddTransactionForm onAdd={handleAddTransaction} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatisticsView = ({ transactions }) => {
  const [statsPeriod, setStatsPeriod] = useState('monthly'); // 'monthly', 'annual'
  const [currentDate, setCurrentDate] = useState(new Date());

  const chartData = useMemo(() => {
    if (statsPeriod === 'annual') {
      const startOfYearDate = startOfYear(currentDate);
      const endOfYearDate = endOfYear(currentDate);
      const months = eachMonthOfInterval({
        start: startOfYearDate,
        end: endOfYearDate > new Date() ? new Date() : endOfYearDate
      });

      return months.map(month => {
        const monthTxs = transactions.filter(t => isSameMonth(t.date, month));
        const income = monthTxs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
        const expense = monthTxs.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        return {
          name: format(month, 'MMM', { locale: es }),
          ingresos: income,
          gastos: expense
        };
      });
    } else {
      // Monthly view: show day by day or just simple aggregation for the month is usually enough, 
      // but let's show weeks for a monthly view to make it interesting
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate) > new Date() ? new Date() : endOfMonth(currentDate);
      
      // Simple daily view for the month
      const days = eachDayOfInterval({ start, end });
      // To keep chart readable, we can group by 5-day intervals or just show the days. 
      // Let's group by days for now.
      return days.map(day => {
        const dayTxs = transactions.filter(t => isSameDay(t.date, day));
        const income = dayTxs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
        const expense = dayTxs.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
        return {
          name: format(day, 'dd'),
          ingresos: income,
          gastos: expense
        };
      });
    }
  }, [transactions, statsPeriod, currentDate]);

  const stats = useMemo(() => {
    const periodTxs = transactions.filter(t => 
      statsPeriod === 'annual' ? isSameYear(t.date, currentDate) : isSameMonth(t.date, currentDate)
    );
    
    const income = periodTxs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
    const expense = periodTxs.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
    const balance = income - expense;
    
    // Find category with most expense
    const categories = periodTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    
    let topCategory = "N/A";
    let topCategoryAmount = 0;
    Object.entries(categories).forEach(([name, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = name;
      }
    });

    return { income, expense, balance, topCategory, topCategoryPct: expense > 0 ? (topCategoryAmount / expense * 100).toFixed(0) : 0 };
  }, [transactions, statsPeriod, currentDate]);

  const handlePrev = () => {
    setCurrentDate(statsPeriod === 'annual' ? subMonths(currentDate, 12) : subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(statsPeriod === 'annual' ? addMonths(currentDate, 12) : addMonths(currentDate, 1));
  };

  return (
    <motion.div 
      className="stats-container animate-up"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="stats-period-selector">
        <button 
          className={`period-toggle ${statsPeriod === 'monthly' ? 'active' : ''}`}
          onClick={() => setStatsPeriod('monthly')}
        >
          Mensual
        </button>
        <button 
          className={`period-toggle ${statsPeriod === 'annual' ? 'active' : ''}`}
          onClick={() => setStatsPeriod('annual')}
        >
          Anual
        </button>
      </div>

      <div className="stats-month-nav">
        <button className="nav-arrow" onClick={handlePrev}><ChevronLeft size={20} /></button>
        <div className="current-period-label">
          {statsPeriod === 'annual' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM yyyy', { locale: es })}
        </div>
        <button className="nav-arrow" onClick={handleNext}><ChevronRight size={20} /></button>
      </div>
      
      <div className="chart-wrapper glass">
        <h4 className="chart-subtitle">Balance de {statsPeriod === 'annual' ? 'el Año' : 'el Mes'}</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} 
              tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                backgroundColor: 'var(--surface-color)',
                fontSize: '11px'
              }}
            />
            <Bar dataKey="ingresos" fill="var(--primary-color)" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="gastos" fill="var(--expense-color)" radius={[4, 4, 0, 0]} name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-grid">
        <div className="stat-summary-card glass">
          <div className="stat-icon-circle balance">
            <BarChart2 size={20} />
          </div>
          <span className="summary-label">Balance Total</span>
          <span className={`summary-value ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(stats.balance)}
          </span>
          <span className="summary-subtitle">{statsPeriod === 'annual' ? 'Consolidado anual' : 'Cierre de mes'}</span>
        </div>
        
        <div className="stat-summary-card glass">
          <div className="stat-icon-circle expense">
            <ArrowDownRight size={20} />
          </div>
          <span className="summary-label">Mayor Gasto</span>
          <span className="summary-value truncate">{stats.topCategory}</span>
          <span className="summary-pct">{stats.topCategoryPct}% del total</span>
        </div>
      </div>
    </motion.div>
  );
};

const AuthView = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate auth for study group
    if (mode === 'login' && email && password) {
      onLogin({ email, name: email.split('@')[0] });
    } else if (mode === 'register' && name && email && password) {
      onLogin({ email, name });
    }
  };

  const handleGoogleLogin = () => {
    // Placeholder for Google Auth integration
    console.log("Iniciando Google Login...");
    onLogin({ email: 'usuario@google.com', name: 'Usuario Google' });
  };

  return (
    <div className="auth-fullscreen">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="auth-header">
          <h2>{mode === 'login' ? 'Bienvenido' : 'Crea tu cuenta'}</h2>
          <div className="auth-logo-large-wrapper">
            <img src={logo} alt="GoCoink" className="auth-logo-huge" />
          </div>
          <p>{mode === 'login' ? 'Gestiona tus finanzas personales' : 'Únete al grupo de estudio financiero'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-input-group">
              <User size={18} className="auth-icon" />
              <input 
                type="text" 
                placeholder="Nombre Completo" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
          )}
          
          <div className="auth-input-group">
            <Mail size={18} className="auth-icon" />
            <input 
              type="email" 
              placeholder="Correo Electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="auth-input-group">
            <Lock size={18} className="auth-icon" />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-divider">
          <span>O continúa con</span>
        </div>

        <button onClick={handleGoogleLogin} className="google-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4"/>
            <path d="M12.24 24C15.4832 24 18.2111 22.922 20.1944 21.1039L16.3274 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.51631V17.3912C3.55371 21.4434 7.7029 24 12.24 24Z" fill="#34A853"/>
            <path d="M5.50254 14.3003C5.25754 13.57 5.12534 12.7932 5.12534 12C5.12534 11.2068 5.25754 10.43 5.50254 9.69973V6.60883H1.51631C0.544521 8.54131 0 10.7186 0 12C0 13.2814 0.544521 15.4587 1.51631 17.3912L5.50254 14.3003Z" fill="#FBBC05"/>
            <path d="M12.24 4.748C14.0074 4.748 15.5951 5.35658 16.8431 6.54545L20.2693 3.11918C18.2066 1.19659 15.4788 0 12.24 0C7.7029 0 3.55371 2.5566 1.51631 6.60883L5.50705 9.69973C6.45946 6.86014 9.11388 4.748 12.24 4.748Z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>¿No tienes cuenta? <span onClick={() => setMode('register')}>Regístrate aquí</span></p>
          ) : (
            <p>¿Ya eres parte? <span onClick={() => setMode('login')}>Inicia sesión</span></p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const AddTransactionForm = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState(null);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(rawValue, 10) || 0;
    setAmount(numericValue);
    setDisplayAmount(formatNumber(numericValue));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount || !type) return;
    onAdd({
      id: Date.now(),
      title,
      amount: amount,
      type,
      category: type === 'income' ? 'Ingreso' : 'Gasto',
      date: new Date(),
      icon: type === 'income' ? <Plus size={20} /> : <ShoppingBag size={20} />
    });
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button 
          type="button" 
          className={`toggle-btn income ${type === 'income' ? 'active' : ''}`}
          onClick={() => setType('income')}
        >
          Ingreso
        </button>
        <button 
          type="button" 
          className={`toggle-btn expense ${type === 'expense' ? 'active' : ''}`}
          onClick={() => setType('expense')}
        >
          Gasto
        </button>
      </div>

      <div className="input-group">
        <input 
          type="text" 
          placeholder="Ej. Mercado Semanal" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="input-group">
        <label>Cantidad</label>
        <div className="amount-input-wrapper">
          <span className="currency">$</span>
          <input 
            type="text" 
            inputMode="numeric"
            placeholder="0" 
            value={displayAmount}
            onChange={handleAmountChange}
            required
          />
        </div>
      </div>
      <button type="submit" className="submit-btn">Añadir Registro</button>
    </form>
  );
};

export default App;
