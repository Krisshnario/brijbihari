"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { RecordsTable } from "@/components/RecordsTable";
import { DevoteeDirectory } from "@/components/DevoteeDirectory";
import { ExcelImportView } from "@/components/ExcelImportView";
import { ExportUtility } from "@/components/ExportUtility";
import { AuditLogView } from "@/components/AuditLogView";
import { EventsView } from "@/components/EventsView";
import { AshramDaanView } from "@/components/AshramDaanView";
import { AddEntryModal } from "@/components/AddEntryModal";
import { CorrectionModal } from "@/components/CorrectionModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { DashboardStats, DonationEntry, EventItem, AshramDaanStats } from "@/types";
import { 
  getDashboardStats, 
  getDonationRecords, 
  getEvents, 
  computeEventStatus,
  getAshramDaanStats 
} from "@/lib/db";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Dashboard Data
  const [stats, setStats] = useState<DashboardStats>({
    targetShivlings: 51000,
    registeredShivlings: 0,
    remainingShivlings: 51000,
    totalDonationAmount: 0,
    totalEntries: 0,
    paidEntriesCount: 0,
    pendingEntriesCount: 0,
    partialEntriesCount: 0,
  });

  const [recentEntries, setRecentEntries] = useState<DonationEntry[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [ashramStats, setAshramStats] = useState<AshramDaanStats>({
    totalAmount: 0,
    totalReceipts: 0,
    gauSevaAmount: 0,
    annakshetraAmount: 0,
    constructionAmount: 0,
    santSevaAmount: 0,
    otherAmount: 0,
    cashAmount: 0,
    onlineAmount: 0,
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [correctionEntry, setCorrectionEntry] = useState<DonationEntry | null>(null);
  const [receiptEntry, setReceiptEntry] = useState<DonationEntry | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Load stats, recent entries, events, and ashram daan stats
  const loadDashboardData = async () => {
    try {
      const s = await getDashboardStats();
      setStats(s);

      const r = await getDonationRecords({ pageSize: 5, sortBy: "dateDesc" });
      setRecentEntries(r.data);

      const evs = await getEvents();
      setEvents(evs);

      const aStats = await getAshramDaanStats();
      setAshramStats(aStats);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };



  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const handleEntryAdded = (newEntry: DonationEntry) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCorrectionComplete = (updatedEntry: DonationEntry) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const upcomingEventsCount = events.filter(
    (ev) => computeEventStatus(ev.startDate, ev.endDate, ev.statusOverride) !== "सम्पन्न"
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-950 flex flex-col font-sans selection:bg-[#D84315] selection:text-white">
      
      {/* Divine Top Header */}
      <Header
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          totalEntriesCount={stats.totalEntries}
          upcomingEventsCount={upcomingEventsCount}
          ashramDaanCount={ashramStats.totalReceipts}
        />

        {/* Dynamic Main View Pane */}
        <main className="flex-1 min-w-0">
          {activeTab === "dashboard" && (
            <DashboardView
              stats={stats}
              recentEntries={recentEntries}
              events={events}
              ashramStats={ashramStats}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectEntry={(entry) => setReceiptEntry(entry)}
            />
          )}

          {activeTab === "events" && (
            <EventsView onRefreshStats={loadDashboardData} />
          )}

          {activeTab === "ashramDaan" && (
            <AshramDaanView onRefreshGlobalStats={loadDashboardData} />
          )}

          {activeTab === "records" && (
            <RecordsTable
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onPrintReceipt={(entry) => setReceiptEntry(entry)}
              onSelectEntryForCorrection={(entry) => setCorrectionEntry(entry)}
              refreshTrigger={refreshTrigger}
            />
          )}


          {activeTab === "devotees" && <DevoteeDirectory />}

          {activeTab === "import" && <ExcelImportView />}

          {activeTab === "export" && <ExportUtility />}

          {activeTab === "audit" && <AuditLogView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-6 border-t-2 border-[#D4AF37] text-center text-xs space-y-1">
        <p className="font-serif font-bold text-[#FDE68A]">बृजविहारी गौ तीर्थ धाम - 51,000 शिवलिंग निर्माण दान प्रबंधन प्रणाली</p>
        <p className="text-stone-500">सर्वाधिकार सुरक्षित © 2026 | जय श्री कृष्णा - जय गौ माता</p>
      </footer>

      {/* MODALS */}
      <AddEntryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEntryAdded={handleEntryAdded}
        onPrintReceiptRequested={(entry) => setReceiptEntry(entry)}
      />

      <CorrectionModal
        isOpen={Boolean(correctionEntry)}
        entry={correctionEntry}
        onClose={() => setCorrectionEntry(null)}
        onCorrectionComplete={handleCorrectionComplete}
      />

      <ReceiptModal
        isOpen={Boolean(receiptEntry)}
        entry={receiptEntry}
        onClose={() => setReceiptEntry(null)}
      />

    </div>
  );
}
