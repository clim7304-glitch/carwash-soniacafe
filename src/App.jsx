import React, { useState, useEffect } from 'react';

// Anggota Tetap & Komisi Gaji per Mobil (Sistem Rata Semua Dapat Gaji)
const OPERATORS = [
  { id: 'aci_evi', nama: 'Aci Evi', tarif: 5000 },
  { id: 'bang_tomy', nama: 'Bang Tomy', tarif: 5000 },
  { id: 'gilang', nama: 'Gilang', tarif: 3500 },
  { id: 'syahril', nama: 'Syahril', tarif: 3500 },
  { id: 'febi', nama: 'Febi', tarif: 3500 }
];

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('carWash_sim_tx');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('carWash_sim_ex');
    return saved ? JSON.parse(saved) : [];
  });

  // State Form Transaksi
  const [formData, setFormData] = useState({
    nama: '', wa: '', plat: '', mobil: '', warna: '', layanan: 'Full', status: 'Belum Bayar', metode: 'Cash', ditinggal: false
  });

  // State Form Pengeluaran
  const [expenseData, setExpenseData] = useState({ deskripsi: '', nominal: '' });

  // Filter Tanggal
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [activeDateFilter, setActiveDateFilter] = useState('hari_ini');

  // Tab Menu Aktif
  const [activeTab, setActiveTab] = useState('transaksi');

  // Notifikasi Kustom
  const [notification, setNotification] = useState(null);

  // Modal Cetak / Preview Thermal
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    type: 'ticket',
    data: null
  });

  // Daftar Harga Layanan
  const hargaLayanan = {
    Full: 50000,
    Body: 40000
  };

  useEffect(() => {
    localStorage.setItem('carWash_sim_tx', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('carWash_sim_ex', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama || !formData.wa || !formData.plat || !formData.mobil || !formData.warna) {
      showNotification("Mohon lengkapi seluruh data transaksi!", "error");
      return;
    }

    // --- LOGIKA ANTI DOUBLE INPUT (NORMALISASI PLAT NOMOR) ---
    const normalizedInputPlat = formData.plat.replace(/\s+/g, '').toUpperCase();
    
    const isDuplicate = transactions.some(t => {
      const isSameDay = t.tanggal === getTodayDate();
      const normalizedExistingPlat = t.plat ? t.plat.replace(/\s+/g, '').toUpperCase() : '';
      return isSameDay && normalizedExistingPlat !== '' && (normalizedExistingPlat === normalizedInputPlat);
    });

    if (isDuplicate) {
      showNotification(`⛔ Plat Nomor "${formData.plat.toUpperCase()}" sudah terdaftar di antrean hari ini!`, "error");
      return; 
    }
    // ---------------------------------------------------------
    
    const newTransaction = {
      ...formData,
      plat: formData.plat.toUpperCase(),
      id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      tanggal: getTodayDate(),
      jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      harga: hargaLayanan[formData.layanan]
    };
    
    setTransactions([newTransaction, ...transactions]);
    setFormData({ nama: '', wa: '', plat: '', mobil: '', warna: '', layanan: 'Full', status: 'Belum Bayar', metode: 'Cash', ditinggal: false });
    
    if (newTransaction.ditinggal) {
      setPrintModal({
        isOpen: true,
        type: 'ticket',
        data: newTransaction
      });
      showNotification(`🚗 Mobil ${newTransaction.plat} (Ditinggal) didaftarkan! Struk siap cetak.`);
    } else {
      showNotification(`🚗 Mobil ${newTransaction.plat} berhasil didaftarkan!`);
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseData.deskripsi || !expenseData.nominal) {
      showNotification("Mohon lengkapi data pengeluaran!", "error");
      return;
    }
    const newExpense = {
      id: 'EX-' + Math.floor(1000 + Math.random() * 9000),
      tanggal: getTodayDate(),
      deskripsi: expenseData.deskripsi,
      nominal: parseInt(expenseData.nominal)
    };
    setExpenses([newExpense, ...expenses]);
    setExpenseData({ deskripsi: '', nominal: '' });
    showNotification(`💸 Pengeluaran "${newExpense.deskripsi}" berhasil dicatat!`);
  };

  const toggleStatus = (id) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Lunas' ? 'Belum Bayar' : 'Lunas';
        showNotification(`Status Pembayaran ${t.nama} diubah ke: ${nextStatus}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const changePaymentMethod = (id, newMethod) => {
    setTransactions(transactions.map(t => {
      if (t.id === id) {
        showNotification(`Metode Pembayaran ${t.nama} diubah ke: ${newMethod}`);
        return { ...t, metode: newMethod };
      }
      return t;
    }));
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
    showNotification("Transaksi berhasil dihapus.", "info");
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
    showNotification("Catatan pengeluaran berhasil dihapus.", "info");
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const incomeToday = transactions
    .filter(t => t.tanggal === getTodayDate() && t.status === 'Lunas')
    .reduce((sum, t) => sum + t.harga, 0);

  const filteredTransactions = transactions.filter(t => t.tanggal >= startDate && t.tanggal <= endDate);
  const filteredExpensesList = expenses.filter(e => e.tanggal >= startDate && e.tanggal <= endDate);

  const filteredIncome = filteredTransactions
    .filter(t => t.status === 'Lunas')
    .reduce((sum, t) => sum + t.harga, 0);

  const filteredExpenses = filteredExpensesList
    .reduce((sum, e) => sum + e.nominal, 0);

  // --- LOGIKA KALKULASI GAJI (SISTEM KHUSUS HARI MINGGU = 5000 RATA) ---
  const getGajiBreakdown = (txList) => {
    const totalCars = txList.length;
    let carsNormal = 0;
    let carsSunday = 0;

    // Pisahkan jumlah mobil hari normal vs hari minggu
    txList.forEach(tx => {
      const isSunday = new Date(tx.tanggal).getDay() === 0; // 0 = Hari Minggu
      if (isSunday) {
        carsSunday++;
      } else {
        carsNormal++;
      }
    });

    return OPERATORS.map(op => {
      const tarifMinggu = 5000; // Fixed rate hari minggu untuk SEMUA orang
      const totalGajiNormal = carsNormal * op.tarif;
      const totalGajiMinggu = carsSunday * tarifMinggu;
      const totalGaji = totalGajiNormal + totalGajiMinggu;

      return {
        id: op.id,
        nama: op.nama,
        tarif: op.tarif,
        totalGaji: totalGaji,
        count: totalCars,
        carsNormal: carsNormal,
        carsSunday: carsSunday
      };
    });
  };

  const currentGajiBreakdown = getGajiBreakdown(filteredTransactions);
  const totalGajiOperator = currentGajiBreakdown.reduce((sum, g) => sum + g.totalGaji, 0);
  const netOwnerProfit = filteredIncome - filteredExpenses - totalGajiOperator;

  const setQuickFilter = (type) => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    
    let startStr = endStr;
    let finalEndStr = endStr;

    if (type === 'hari_ini') {
      startStr = endStr;
    } else if (type === 'kemarin') {
      const yest = new Date();
      yest.setDate(today.getDate() - 1);
      startStr = yest.toISOString().split('T')[0];
      finalEndStr = startStr; 
    } else if (type === '7_hari') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      startStr = lastWeek.toISOString().split('T')[0];
    } else if (type === 'semua') {
      startStr = "2020-01-01";
    }

    setStartDate(startStr);
    setEndDate(finalEndStr);
    setActiveDateFilter(type);
    
    const labels = {
      hari_ini: 'Hari Ini',
      kemarin: 'Kemarin',
      '7_hari': '7 Hari Terakhir',
      semua: 'Seluruh Data'
    };
    showNotification(`Filter diatur ke: ${labels[type]}`, 'info');
  };

  const triggerPrint = () => {
    window.print();
  };

  const openTicketPrint = (tx) => {
    setPrintModal({
      isOpen: true,
      type: 'ticket',
      data: tx
    });
  };

  const openDailyReportPrint = () => {
    const reportData = {
      tanggalAwal: startDate,
      tanggalAkhir: endDate,
      totalMobil: filteredTransactions.length,
      mobilLunas: filteredTransactions.filter(t => t.status === 'Lunas').length,
      mobilBelumLunas: filteredTransactions.filter(t => t.status !== 'Lunas').length,
      totalPemasukan: filteredIncome,
      totalPengeluaran: filteredExpenses,
      gajiOperator: totalGajiOperator,
      labaOwner: netOwnerProfit,
      breakdownGaji: currentGajiBreakdown
    };
    setPrintModal({
      isOpen: true,
      type: 'report',
      data: reportData
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 p-4 md:p-8 font-sans relative overflow-x-hidden selection:bg-amber-600 selection:text-white print:p-0 print:m-0 print:min-h-0 print:block">
      
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none print:hidden"></div>
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none print:hidden"></div>

      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 print:hidden ${
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-800 text-rose-200' :
          notification.type === 'info' ? 'bg-amber-950/90 border-amber-800 text-amber-200' :
          'bg-emerald-950/90 border-emerald-800 text-emerald-200'
        }`}>
          <div className="text-xl">
            {notification.type === 'error' ? '☕' : notification.type === 'info' ? '✨' : '🌿'}
          </div>
          <p className="font-semibold text-sm">{notification.message}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8 relative z-10 print:hidden">
        
        {/* Header Dashboard */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-stone-900/80 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-stone-800/80 shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-amber-500/10 transform hover:rotate-6 transition-transform">
              ✨
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Sonia <span className="text-amber-500">Car Wash</span>
              </h1>
              <p className="text-xs text-stone-400 font-medium">Cozy Detailing Lounge & Smart Revenue Dashboard</p>
            </div>
          </div>
        </header>

        {/* Financial Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-500/5 rounded-full flex items-center justify-center">☕</div>
            <h3 className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Income Hari Ini (Lunas)</h3>
            <p className="text-3xl font-black text-amber-400 mt-2">{formatRupiah(incomeToday)}</p>
            <div className="text-[10px] text-stone-500 mt-2 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Real-time hari ini
            </div>
          </div>
          
          <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-emerald-500/5 rounded-full flex items-center justify-center">🌿</div>
            <h3 className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Total Pendapatan Terfilter</h3>
            <p className="text-3xl font-black text-emerald-400 mt-2">{formatRupiah(filteredIncome)}</p>
            <div className="text-[10px] text-stone-500 mt-2">Rentang tanggal aktif</div>
          </div>

          <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-all duration-300">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-rose-500/5 rounded-full flex items-center justify-center">🍂</div>
            <h3 className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Total Pengeluaran</h3>
            <p className="text-3xl font-black text-rose-400 mt-2">{formatRupiah(filteredExpenses)}</p>
            <div className="text-[10px] text-stone-500 mt-2">Catatan operasional harian</div>
          </div>

          <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-lg relative overflow-hidden group hover:border-amber-400/30 transition-all duration-300">
            <div className="absolute -top-3 -right-3 w-16 h-16 bg-amber-400/5 rounded-full flex items-center justify-center">✨</div>
            <h3 className="text-stone-400 text-xs font-semibold uppercase tracking-wider">Laba Bersih Owner</h3>
            <p className={`text-3xl font-black mt-2 ${netOwnerProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>{formatRupiah(netOwnerProfit)}</p>
            <div className="text-[10px] text-stone-500 mt-2">Sudah dikurangi Gaji Operator & Biaya</div>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="bg-stone-900/80 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <h3 className="font-bold text-white text-base">Jangka Waktu Laporan</h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800/50">
              <button 
                onClick={() => setQuickFilter('hari_ini')} 
                className={`text-xs font-semibold py-2 px-3 rounded-xl transition-all ${activeDateFilter === 'hari_ini' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
              >
                Hari Ini
              </button>
              <button 
                onClick={() => setQuickFilter('kemarin')} 
                className={`text-xs font-semibold py-2 px-3 rounded-xl transition-all ${activeDateFilter === 'kemarin' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
              >
                Kemarin
              </button>
              <button 
                onClick={() => setQuickFilter('7_hari')} 
                className={`text-xs font-semibold py-2 px-3 rounded-xl transition-all ${activeDateFilter === '7_hari' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
              >
                7 Hari Terakhir
              </button>
              <button 
                onClick={() => setQuickFilter('semua')} 
                className={`text-xs font-semibold py-2 px-3 rounded-xl transition-all ${activeDateFilter === 'semua' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/30 shadow-md' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}`}
              >
                Semua
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-2xl border border-stone-800/60 focus-within:border-amber-500/50 transition-colors">
              <span className="text-xs font-semibold text-stone-400 w-16">Mulai:</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setStartDate(e.target.value); setActiveDateFilter('custom'); }} 
                className="bg-transparent text-white text-sm focus:outline-none w-full cursor-pointer" 
              />
            </div>
            <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-2xl border border-stone-800/60 focus-within:border-amber-500/50 transition-colors">
              <span className="text-xs font-semibold text-stone-400 w-16">Selesai:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setEndDate(e.target.value); setActiveDateFilter('custom'); }} 
                className="bg-transparent text-white text-sm focus:outline-none w-full cursor-pointer" 
              />
            </div>
          </div>
        </div>

        {/* Forms Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Input Form */}
          <div className="bg-stone-900/60 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-stone-800/80 shadow-xl lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-stone-800 pb-4">
              <span className="text-xl">✍️</span>
              <h2 className="text-xl font-bold text-white">Input Order Baru</h2>
            </div>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Nama Pelanggan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Ridho Juragan Cinta" 
                    required 
                    value={formData.nama} 
                    onChange={e => setFormData({...formData, nama: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm text-white placeholder-stone-600" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Nomor WhatsApp</label>
                  <input 
                    type="tel" 
                    placeholder="Contoh: 08123456789" 
                    required 
                    value={formData.wa} 
                    onChange={e => setFormData({...formData, wa: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm text-white placeholder-stone-600" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Plat Nomor</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: BK 1234 ABC" 
                    required 
                    value={formData.plat} 
                    onChange={e => setFormData({...formData, plat: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm text-white placeholder-stone-600 uppercase" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Tipe Kendaraan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Honda HRV" 
                    required 
                    value={formData.mobil} 
                    onChange={e => setFormData({...formData, mobil: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm text-white placeholder-stone-600" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Warna Mobil</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Putih Sleek" 
                    required 
                    value={formData.warna} 
                    onChange={e => setFormData({...formData, warna: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all text-sm text-white placeholder-stone-600" 
                  />
                </div>
              </div>

              {/* Input Layanan & Pembayaran */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Jenis Layanan</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, layanan: 'Full'})}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        formData.layanan === 'Full'
                          ? 'bg-amber-600 text-stone-950 shadow-md'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      Full (50k)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, layanan: 'Body'})}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        formData.layanan === 'Body'
                          ? 'bg-amber-600 text-stone-950 shadow-md'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      Body (40k)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Status Pembayaran</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'Belum Bayar'})}
                      className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        formData.status === 'Belum Bayar'
                          ? 'bg-rose-900/80 border border-rose-700/50 text-rose-200 shadow-md font-extrabold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      🔴 Belum
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, status: 'Lunas'})}
                      className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        formData.status === 'Lunas'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80 shadow-md font-extrabold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      🟢 Lunas
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-400 mb-1 block">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, metode: 'Cash'})}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        formData.metode === 'Cash'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md font-extrabold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      💵 CASH
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, metode: 'Transfer'})}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        formData.metode === 'Transfer'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md font-extrabold'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                      }`}
                    >
                      💳 TF
                    </button>
                  </div>
                </div>
              </div>

              {/* Opsi Mobil Ditinggal */}
              <div className="flex flex-col justify-end pt-2">
                <label className="relative flex items-center gap-3 bg-stone-950 p-3.5 rounded-2xl border border-stone-800 cursor-pointer hover:bg-stone-900 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.ditinggal} 
                    onChange={e => setFormData({...formData, ditinggal: e.target.checked})} 
                    className="w-4 h-4 text-amber-500 bg-stone-900 border-stone-800 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-stone-200">🔑 Mobil Ditinggal (Kunci Dititip)</span>
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black p-4 rounded-2xl hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 mt-2 text-sm"
              >
                📥 Simpan Transaksi Antrean
              </button>
            </form>
          </div>

          {/* Side Panels: Operator Info & Expenses */}
          <div className="space-y-6">
            
            {/* Operator List Info */}
            <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
                <span className="text-xl">👥</span>
                <h2 className="text-base font-bold text-white">Sistem Komisi Tim Sonia</h2>
              </div>
              <p className="text-[11px] text-stone-400 mb-4 leading-relaxed">
                Khusus hari Minggu, tarif komisi disamaratakan menjadi Rp 5.000 per operator untuk setiap mobil yang masuk.
              </p>
              
              <div className="space-y-2.5">
                {OPERATORS.map((op) => (
                  <div key={op.id} className="flex items-center justify-between p-3 rounded-2xl bg-stone-950 border border-stone-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400">👤</span>
                      <span className="text-xs font-bold text-stone-200">{op.nama}</span>
                    </div>
                    <span className="text-xs font-black text-amber-400">+{formatRupiah(op.tarif)} <span className="text-[9px] text-stone-500 font-normal">/mobil</span></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Catat Pengeluaran */}
            <div className="bg-stone-900/60 backdrop-blur-md p-6 rounded-3xl border border-stone-800/80 shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-3">
                <span className="text-xl">💸</span>
                <h2 className="text-base font-bold text-white">Catat Pengeluaran</h2>
              </div>
              
              <form onSubmit={handleExpenseSubmit} className="space-y-3">
                <div>
                  <input 
                    type="text" 
                    placeholder="Keterangan pengeluaran" 
                    required 
                    value={expenseData.deskripsi} 
                    onChange={e => setExpenseData({...expenseData, deskripsi: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all text-xs text-white placeholder-stone-600" 
                  />
                </div>
                <div>
                  <input 
                    type="number" 
                    placeholder="Nominal Rupiah" 
                    required 
                    value={expenseData.nominal} 
                    onChange={e => setExpenseData({...expenseData, nominal: e.target.value})} 
                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 outline-none transition-all text-xs text-white placeholder-stone-600" 
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold p-3 rounded-2xl border border-rose-800/30 active:scale-[0.98] transition-all text-xs"
                >
                  📌 Simpan Pengeluaran
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Main Records Table & Action Panel */}
        <div className="bg-stone-900/60 backdrop-blur-md rounded-3xl border border-stone-800/80 shadow-2xl overflow-hidden">
          
          {/* Segment Selection Header */}
          <div className="flex flex-wrap border-b border-stone-800/80 bg-stone-950/60 p-1.5">
            <button 
              onClick={() => setActiveTab('transaksi')}
              className={`flex-1 min-w-[150px] py-4 text-center text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'transaksi' 
                  ? 'bg-amber-600 text-stone-950 shadow-lg font-black' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              🚗 Daftar Antrean ({filteredTransactions.length})
            </button>
            <button 
              onClick={() => setActiveTab('pengeluaran')}
              className={`flex-1 min-w-[150px] py-4 text-center text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'pengeluaran' 
                  ? 'bg-amber-600 text-stone-950 shadow-lg font-black' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              💸 Pengeluaran ({filteredExpensesList.length})
            </button>
            <button 
              onClick={() => setActiveTab('laporan_gaji')}
              className={`flex-1 min-w-[150px] py-4 text-center text-xs font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'laporan_gaji' 
                  ? 'bg-amber-600 text-stone-950 shadow-lg font-black' 
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              📊 Gaji & Rekap Harian
            </button>
          </div>

          <div className="p-6">
            
            {/* TAB 1: Antrean & Transaksi */}
            {activeTab === 'transaksi' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Tanggal / ID</th>
                      <th className="p-3">Pelanggan</th>
                      <th className="p-3">Kendaraan / Plat</th>
                      <th className="p-3">Layanan</th>
                      <th className="p-3">Status / Metode Bayar</th>
                      <th className="p-3 text-center">Aksi Cetak / Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/30">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-12 text-center text-stone-500">
                          <p className="text-4xl mb-3">☕</p>
                          <p className="text-sm font-medium">Lounge santai. Belum ada antrean kendaraan terdaftar.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, index) => (
                        <tr key={t.id} className="hover:bg-stone-800/30 transition-colors group">
                          <td className="p-3 text-center text-xs font-bold text-stone-500">
                            {index + 1}
                          </td>
                          <td className="p-3 text-xs font-mono text-stone-500">
                            <div>{t.tanggal}</div>
                            <div className="text-[10px] font-bold text-amber-500">{t.id}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{t.nama}</div>
                            <div className="text-xs text-stone-400 mt-0.5">{t.wa}</div>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="font-bold text-amber-400 text-[11px] mb-0.5">{t.plat ? t.plat.toUpperCase() : '-'}</div>
                            <div className="font-medium text-stone-200">{t.mobil}</div>
                            <div className="text-xs text-stone-500">{t.warna}</div>
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-semibold bg-stone-950 text-stone-300 px-2.5 py-1 rounded-xl border border-stone-800">
                              {t.layanan}
                            </span>
                            <div className="text-xs font-bold text-stone-300 mt-1.5">{formatRupiah(t.harga)}</div>
                          </td>
                          <td className="p-3 space-y-2">
                            <div>
                              {t.ditinggal ? (
                                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[9px] font-extrabold animate-pulse block w-max">
                                  🔑 KUNCI DITINGGAL
                                </span>
                              ) : (
                                <span className="bg-stone-850 text-stone-400 px-2.5 py-1 rounded-xl text-[9px] font-semibold block w-max border border-stone-800">
                                  🚗 Pemilik Menunggu
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <button 
                                onClick={() => toggleStatus(t.id)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all transform hover:scale-105 w-max ${
                                  t.status === 'Lunas' 
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' 
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                }`}
                                title="Ubah status bayar"
                              >
                                {t.status === 'Lunas' ? `● Lunas (${(t.metode || 'Cash').toUpperCase()})` : '○ Belum Bayar'}
                              </button>

                              {/* Quick Payment Method Selector */}
                              {t.status === 'Lunas' && (
                                <div className="flex items-center gap-1 mt-1 bg-stone-950 p-0.5 rounded-lg border border-stone-850 w-max">
                                  <button
                                    onClick={() => changePaymentMethod(t.id, 'Cash')}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                                      (t.metode || 'Cash') === 'Cash' 
                                        ? 'bg-amber-600 text-stone-950' 
                                        : 'text-stone-400 hover:text-stone-200'
                                    }`}
                                  >
                                    Cash
                                  </button>
                                  <button
                                    onClick={() => changePaymentMethod(t.id, 'Transfer')}
                                    className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${
                                      (t.metode || 'Cash') === 'Transfer' 
                                        ? 'bg-amber-600 text-stone-950' 
                                        : 'text-stone-400 hover:text-stone-200'
                                    }`}
                                  >
                                    TF
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => openTicketPrint(t)}
                                className="bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold border border-amber-500/20 px-3.5 py-2 rounded-2xl transition-all text-xs flex items-center gap-1 active:scale-95 shadow-md"
                              >
                                🖨️ Cetak Struk
                              </button>
                              <button 
                                onClick={() => deleteTransaction(t.id)} 
                                className="bg-rose-950/20 hover:bg-rose-900 text-rose-400 hover:text-white p-2.5 rounded-2xl transition-all text-xs font-bold"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Pengeluaran */}
            {activeTab === 'pengeluaran' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-800 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-3">Tanggal / ID</th>
                      <th className="p-3">Keterangan Pengeluaran</th>
                      <th className="p-3">Nominal Terdaftar</th>
                      <th className="p-3 text-center">Aksi Kontrol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/30">
                    {filteredExpensesList.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500">
                          <p className="text-4xl mb-3">🍂</p>
                          <p className="text-sm font-medium">Bebas pengeluaran. Belum ada pengeluaran dicatat.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredExpensesList.map((e) => (
                        <tr key={e.id} className="hover:bg-stone-800/30 transition-colors">
                          <td className="p-3 text-xs font-mono text-stone-500">
                            <div>{e.tanggal}</div>
                            <div className="text-[10px] text-stone-650">{e.id}</div>
                          </td>
                          <td className="p-3 text-sm font-semibold text-white">
                            {e.deskripsi}
                          </td>
                          <td className="p-3 text-sm font-bold text-rose-400">
                            {formatRupiah(e.nominal)}
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => deleteExpense(e.id)} 
                              className="bg-rose-950/30 hover:bg-rose-900 text-rose-300 px-3.5 py-2 rounded-2xl border border-rose-900/30 transition-all text-xs font-bold"
                            >
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: Rekap Laporan Gaji & Cetak Laporan Harian */}
            {activeTab === 'laporan_gaji' && (
              <div className="space-y-6">
                
                {/* Cetak Slip Button Panel */}
                <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">📊 Gaji Berbagi Rata & Laporan Sonia</h3>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Laporan keuangan merinci total komisi untuk seluruh **{filteredTransactions.length} mobil** kepada masing-masing operator, pengeluaran kas, kotor, dan laba bersih Sonia Car Wash.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={openDailyReportPrint}
                      className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-amber-500/10 flex items-center gap-2 active:scale-95 transition-all text-xs"
                    >
                      🖨️ Cetak Slip Gaji Bersama (80mm)
                    </button>
                  </div>
                </div>

                {/* Ringkasan Gaji & Laba Utama */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Pemasukan Kotor (Lunas)</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1.5">{formatRupiah(filteredIncome)}</p>
                    <span className="text-[10px] text-stone-500 mt-1 block">Dari {filteredTransactions.filter(t => t.status === 'Lunas').length} Mobil Lunas</span>
                  </div>
                  
                  <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Total Pengeluaran Gaji Tim</span>
                    <p className="text-2xl font-black text-amber-400 mt-1.5">{formatRupiah(totalGajiOperator)}</p>
                    <span className="text-[10px] text-stone-500 mt-1 block">Gaji gabungan seluruh operator tetap</span>
                  </div>

                  <div className="bg-stone-950 p-5 rounded-2xl border border-stone-850">
                    <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Keuntungan Bersih Owner</span>
                    <p className="text-2xl font-black text-amber-300 mt-1.5">{formatRupiah(netOwnerProfit)}</p>
                    <span className="text-[10px] text-stone-500 mt-1 block">Pemasukan - Gaji Tim - Pengeluaran</span>
                  </div>
                </div>

                {/* Breakdown Rincian Gaji Per Anggota */}
                <div className="bg-stone-950 p-6 rounded-3xl border border-stone-850">
                  <h3 className="font-bold text-white text-sm mb-4">Rincian Slip Gaji Bersama ({filteredTransactions.length} Mobil Terhitung)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {currentGajiBreakdown.map((g) => (
                      <div key={g.id} className="bg-stone-900/60 p-4 rounded-2xl border border-stone-850 flex flex-col justify-between">
                        <div>
                          <div className="text-stone-400 text-xs font-semibold">👤 {g.nama}</div>
                          <div className="text-base font-black text-white mt-1.5">{formatRupiah(g.totalGaji)}</div>
                        </div>
                        <div className="text-[10px] text-stone-500 mt-3 pt-2.5 border-t border-stone-850">
                          {g.carsSunday > 0 ? (
                            g.carsNormal > 0 ? (
                              <span>Nrml: {g.carsNormal}x{g.tarif/1000}K | Mgg: {g.carsSunday}x5K</span>
                            ) : (
                              <span>Minggu: {g.carsSunday} Mobil x 5.000</span>
                            )
                          ) : (
                            <span>{g.count} Mobil x {formatRupiah(g.tarif)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* THERMAL PRINTER PREVIEW MODAL */}
      {printModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:hidden">
          <div className="bg-stone-900 rounded-3xl border border-stone-800 p-6 max-w-lg w-full shadow-2xl space-y-6 relative animate-[fadeIn_0.3s_ease-out]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-white text-xs flex items-center gap-2 uppercase tracking-wider">
                🖨️ Simulator Kertas Struk 80mm
              </h3>
              <button 
                onClick={() => setPrintModal({ ...printModal, isOpen: false })} 
                className="text-stone-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* On-Screen simulated Thermal Receipt */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 text-black font-sans text-xs max-h-[420px] overflow-y-auto shadow-inner w-[300px] mx-auto select-none">
              
              <div id="thermal-print-preview" className="receipt-container text-black">
                <div className="text-center font-bold text-sm mb-1 uppercase">SONIA CAR WASH</div>
                <div className="text-center text-[10px] mb-2">Jalan Medan - Tebing Tinggi, Kota Galuh, Kec. Perbaungan, Kabupaten Serdang Bedagai, Sumatera Utara 20698</div>
                <div className="text-center text-[10px] mb-2">Whatsapp/Telephone: 0853-6296-2929</div>
                
                <div className="border-t border-dashed border-black my-2"></div>
                
                {printModal.type === 'ticket' ? (
                  <div className="space-y-2">
                    <div className="text-center font-bold text-[10px] uppercase tracking-wide bg-black text-white py-1 mb-2">
                      {printModal.data.ditinggal ? '--- TIKET MOBIL DITINGGAL ---' : '--- STRUK ANTRIAN CUCI ---'}
                    </div>
                    
                    <table className="w-full text-[10px] mt-2">
                      <tbody>
                        <tr>
                          <td className="font-bold py-0.5">ID Order</td>
                          <td className="text-right py-0.5">{printModal.data.id}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Tgl/Waktu</td>
                          <td className="text-right py-0.5">{printModal.data.tanggal} {printModal.data.jam}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Pelanggan</td>
                          <td className="text-right py-0.5">{printModal.data.nama}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">No. WA</td>
                          <td className="text-right py-0.5">{printModal.data.wa}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Plat Nomor</td>
                          <td className="text-right py-0.5 font-bold">{printModal.data.plat?.toUpperCase()}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Kendaraan</td>
                          <td className="text-right py-0.5">{printModal.data.mobil} ({printModal.data.warna})</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Layanan</td>
                          <td className="text-right py-0.5">{printModal.data.layanan}</td>
                        </tr>
                        <tr>
                          <td className="font-bold py-0.5">Metode Bayar</td>
                          <td className="text-right py-0.5 font-bold uppercase">
                            {printModal.data.status === 'Lunas' ? `LUNAS (${printModal.data.metode?.toUpperCase() || 'CASH'})` : 'BELUM BAYAR'}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-black my-2"></div>

                    <div className="flex justify-between font-bold text-xs">
                      <span>TOTAL BIAYA:</span>
                      <span>{formatRupiah(printModal.data.harga || 0)}</span>
                    </div>

                    <div className="border-t border-dashed border-black my-2"></div>

                    {printModal.data.ditinggal && (
                      <div className="p-2 border border-black rounded text-center text-[10px] font-bold mt-1 space-y-1">
                        <p>📢 PERHATIAN (MOBIL DITINGGAL) 📢</p>
                        <p className="font-normal text-[9px] text-justify leading-relaxed">
                          1. Bawa struk fisik ini untuk bukti sah pengambilan mobil kembali.<br />
                          2. Pastikan barang berharga sudah Anda amankan. Sonia Car Wash tidak bertanggung jawab atas kehilangan barang berharga dalam kendaraan.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-center font-bold text-[10px] bg-black text-white py-1">
                      REKAP GAJI GABUNGAN TIM
                    </div>
                    
                    <div className="text-center text-[9px] font-semibold mt-1">
                      Periode: {printModal.data.tanggalAwal} s/d {printModal.data.tanggalAkhir}
                    </div>

                    <div className="border-t border-dashed border-black my-1.5"></div>

                    <table className="w-full text-[10px]">
                      <tbody>
                        <tr>
                          <td className="py-0.5">Total Cucian Masuk</td>
                          <td className="text-right py-0.5">{printModal.data.totalMobil} Unit</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">Cucian Lunas</td>
                          <td className="text-right py-0.5">{printModal.data.mobilLunas} Unit</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">Cucian Belum Lunas</td>
                          <td className="text-right py-0.5">{printModal.data.mobilBelumLunas} Unit</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-black my-1"></div>

                    <div className="text-[10px] font-bold uppercase py-0.5">Rincian Komisi Bersama ({printModal.data.totalMobil} Unit):</div>
                    <table className="w-full text-[10px]">
                      <tbody>
                        {printModal.data.breakdownGaji?.map(op => {
                          let label = `All ${op.count} unit`;
                          if (op.carsSunday > 0 && op.carsNormal === 0) label = `Mgg ${op.carsSunday} unit`;
                          else if (op.carsSunday > 0 && op.carsNormal > 0) label = `Nrml ${op.carsNormal}, Mgg ${op.carsSunday}`;
                          
                          return (
                            <tr key={op.id}>
                              <td className="py-0.5">{op.nama} ({label})</td>
                              <td className="text-right py-0.5 font-bold">{formatRupiah(op.totalGaji)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-black my-1"></div>

                    <div className="text-[10px] font-bold uppercase py-0.5">Rincian Keuangan:</div>
                    <table className="w-full text-[10px]">
                      <tbody>
                        <tr>
                          <td className="py-0.5">Pemasukan Kotor (Lunas)</td>
                          <td className="text-right py-0.5 font-bold">{formatRupiah(printModal.data.totalPemasukan)}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">Pengeluaran Operasional</td>
                          <td className="text-right py-0.5 font-semibold">({formatRupiah(printModal.data.totalPengeluaran)})</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">Total Gaji Seluruh Tim</td>
                          <td className="text-right py-0.5 font-semibold">({formatRupiah(printModal.data.gajiOperator)})</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="border-t border-dashed border-black my-1.5"></div>

                    <div className="flex justify-between font-bold text-[11px]">
                      <span>SISA BERSIH OWNER:</span>
                      <span>{formatRupiah(printModal.data.labaOwner)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-[11px]">
                      <span>GAJI ACI EVI:</span>
                    </div>

                    <div className="border-t border-dashed border-black my-3"></div>

                    <div className="grid grid-cols-2 text-center text-[9px] gap-2 mt-2">
                      <div>
                        <p>Nama Kasir</p>
                        <div className="h-6"></div>
                      </div>
                      <div>
                        <p>Tanda Tangan</p>
                        <div className="h-6"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-black my-3"></div>
                <div className="text-center text-[9px] font-semibold">Terima Kasih Atas Kerja Kerasnya!</div>
                <div className="text-center text-[8px] text-gray-500">Sonia Cafe</div>
              </div>

            </div>

            {/* Print Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={() => setPrintModal({ ...printModal, isOpen: false })} 
                className="bg-stone-850 hover:bg-stone-800 text-stone-300 font-bold p-3.5 rounded-2xl transition-all text-xs"
              >
                Batal
              </button>
              <button 
                onClick={triggerPrint} 
                className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-black p-3.5 rounded-2xl transition-all text-xs flex items-center justify-center gap-1 shadow-lg shadow-amber-500/15"
              >
                🖨️ Cetak ke Thermal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXCLUSIVE HIDDEN PRINT CONTAINER */}
      <div id="thermal-print-section" className="hidden print:block text-black bg-white p-0 m-0 font-sans text-xs leading-tight">
        {printModal.data && (
          <div>
            <div className="text-center font-bold text-sm mb-1 uppercase">SONIA CAR WASH</div>
            <div className="text-center text-[9px] mb-1">Jalan Medan - Tebing Tinggi, Kota Galuh, Kec. Perbaungan, Kabupaten Serdang Bedagai, Sumatera Utara 20698</div>
            <div className="text-center text-[9px] mb-2">Whatsapp/Telephone: 0853-6296-2929</div>
            
            <div className="border-t border-dashed border-black my-1"></div>
            
            {printModal.type === 'ticket' ? (
              <div className="space-y-1">
                <div className="text-center font-bold text-[10px] uppercase tracking-wide bg-black text-white py-1 mb-2">
                  {printModal.data.ditinggal ? '--- TIKET MOBIL DITINGGAL ---' : '--- STRUK ANTRIAN CUCI ---'}
                </div>
                
                <table className="w-full text-[10px]">
                  <tbody>
                    <tr>
                      <td className="font-bold py-0.5">ID Order</td>
                      <td className="text-right py-0.5">{printModal.data.id}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Tgl/Waktu</td>
                      <td className="text-right py-0.5">{printModal.data.tanggal} {printModal.data.jam}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Pelanggan</td>
                      <td className="text-right py-0.5">{printModal.data.nama}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">No. WA</td>
                      <td className="text-right py-0.5">{printModal.data.wa}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Plat Nomor</td>
                      <td className="text-right py-0.5 font-bold">{printModal.data.plat?.toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Kendaraan</td>
                      <td className="text-right py-0.5">{printModal.data.mobil} ({printModal.data.warna})</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Layanan</td>
                      <td className="text-right py-0.5">{printModal.data.layanan}</td>
                    </tr>
                    <tr>
                      <td className="font-bold py-0.5">Metode Bayar</td>
                      <td className="text-right py-0.5 font-bold uppercase">
                        {printModal.data.status === 'Lunas' ? `LUNAS (${printModal.data.metode?.toUpperCase() || 'CASH'})` : 'BELUM BAYAR'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1"></div>

                <div className="flex justify-between font-bold text-[11px] py-1">
                  <span>TOTAL BIAYA:</span>
                  <span>{formatRupiah(printModal.data.harga || 0)}</span>
                </div>

                <div className="border-t border-dashed border-black my-1"></div>

                {printModal.data.ditinggal && (
                  <div className="p-1 border border-black rounded text-[9px] mt-1 text-center">
                    <p className="font-bold uppercase mb-1">📢 PERHATIAN (MOBIL DITINGGAL) 📢</p>
                    <p className="text-[8px] text-justify leading-normal">
                      1. Bawa struk fisik ini untuk bukti sah pengambilan mobil kembali.<br />
                      2. Pastikan barang berharga sudah Anda amankan. Sonia Car Wash tidak bertanggung jawab atas kehilangan barang berharga dalam kendaraan.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-center font-bold text-[10px] bg-black text-white py-1">
                  REKAP GAJI GABUNGAN TIM
                </div>
                
                <div className="text-center text-[9px] font-semibold mt-1">
                  Periode: {printModal.data.tanggalAwal} s/d {printModal.data.tanggalAkhir}
                </div>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <table className="w-full text-[10px]">
                  <tbody>
                    <tr>
                      <td className="py-0.5">Total Cucian Masuk</td>
                      <td className="text-right py-0.5">{printModal.data.totalMobil} Unit</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Cucian Lunas</td>
                      <td className="text-right py-0.5">{printModal.data.mobilLunas} Unit</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Cucian Belum Lunas</td>
                      <td className="text-right py-0.5">{printModal.data.mobilBelumLunas} Unit</td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1"></div>

                <div className="text-[10px] font-bold uppercase py-0.5">Rincian Komisi Bersama ({printModal.data.totalMobil} Unit):</div>
                <table className="w-full text-[10px]">
                  <tbody>
                    {printModal.data.breakdownGaji?.map(op => {
                      let label = `All ${op.count} unit`;
                      if (op.carsSunday > 0 && op.carsNormal === 0) label = `Mgg ${op.carsSunday} unit`;
                      else if (op.carsSunday > 0 && op.carsNormal > 0) label = `Nrml ${op.carsNormal}, Mgg ${op.carsSunday}`;
                      
                      return (
                        <tr key={op.id}>
                          <td className="py-0.5">{op.nama} ({label})</td>
                          <td className="text-right py-0.5 font-bold">{formatRupiah(op.totalGaji)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1"></div>

                <div className="text-[10px] font-bold uppercase py-0.5">Rincian Keuangan:</div>
                <table className="w-full text-[10px]">
                  <tbody>
                    <tr>
                      <td className="py-0.5">Pemasukan Kotor (Lunas)</td>
                      <td className="text-right py-0.5 font-bold">{formatRupiah(printModal.data.totalPemasukan)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Pengeluaran Operasional</td>
                      <td className="text-right py-0.5 font-semibold">({formatRupiah(printModal.data.totalPengeluaran)})</td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Total Gaji Seluruh Tim</td>
                      <td className="text-right py-0.5 font-semibold">({formatRupiah(printModal.data.gajiOperator)})</td>
                    </tr>
                  </tbody>
                </table>

                <div className="border-t border-dashed border-black my-1.5"></div>

                <div className="flex justify-between font-bold text-[11px]">
                  <span>SISA BERSIH OWNER:</span>
                  <span>{formatRupiah(printModal.data.labaOwner)}</span>
                </div>

                <div className="flex justify-between font-bold text-[11px]">
                      <span>GAJI ACI EVI:</span>
                    </div>

                <div className="border-t border-dashed border-black my-3"></div>

                <div className="grid grid-cols-2 text-center text-[9px] gap-2 mt-2">
                  <div>
                    <p>Nama Kasir</p>
                    <div className="h-6"></div>
                  </div>
                  <div>
                    <p>Tanda Tangan</p>
                    <div className="h-6"></div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-dashed border-black my-2"></div>
            <div className="text-center text-[9px] font-bold mt-1">Terima Kasih Atas Kepercayaannya!</div>
            <div className="text-center text-[8px] text-gray-650">Sonia Cafe</div>
          </div>
        )}
      </div>

      {/* CSS CUSTOM UNTUK PRINTER THERMAL IWARE (CLEAN SANS-SERIF) */}
      <style>{`
        @media print {
          @page {
            margin: 0mm;
            padding: 0mm;
          }

          body, html, #root {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .min-h-screen {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
          }

          .min-h-screen > div:not(#thermal-print-section) {
            display: none !important;
          }

          #thermal-print-section {
            display: block !important;
            width: 250px !important; 
            margin: 0 auto !important; 
            padding: 0 !important;
            background: white !important;
            
            /* Font Sans-Serif yang rapi dan sangat mudah dibaca */
            font-family: 'Segoe UI', Arial, Helvetica, sans-serif !important;
            font-weight: normal !important; 
          }

          #thermal-print-section * {
            color: #000000 !important;
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse;
          }
          td {
            word-wrap: break-word;
          }
        }
      `}</style>

    </div>
  );
}
