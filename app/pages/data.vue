<script setup>
import {
  CloudUpload,
  Database,
  Edit3,
  FileText,
  PlusSquare,
  Search,
  ShieldCheck,
  Trash2,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import { useApp } from '~/composables/useApp'
import { formatIndonesianTitleDate } from '~/utils/dateUtils.js'

const {
  platforms,
  tryouts,
  sessions,
  settings,
  openApplicationForm,
  deletePlatform,
  deleteTryout,
  openTryoutForm,
  askConfirm,
} = useApp()

const searchQuery = ref('')
const filterPfId = ref('ALL')
const exportingPdf = ref(false)
const exportPdfError = ref('')
const totalStudyHours = computed(() =>
  Math.round(sessions.value.reduce((acc, session) => acc + session.durationMinutes, 0) / 60),
)
const filteredTryouts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return [...tryouts.value]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((tryout) => {
      if (filterPfId.value !== 'ALL' && tryout.applicationId !== filterPfId.value) return false
      if (!query) return true
      const platformName =
        tryout.applicationName?.toLowerCase() || ''
      return (
        (tryout.title || '').toLowerCase().includes(query) ||
        platformName.includes(query)
      )
    })
})
const selectedApplicationName = computed(() =>
  filterPfId.value === 'ALL'
    ? 'Semua aplikasi'
    : platforms.value.find((platform) => platform.id === filterPfId.value)?.name || 'Aplikasi terpilih',
)

async function exportScoreReportPdf() {
  if (exportingPdf.value || filteredTryouts.value.length === 0) return

  exportingPdf.value = true
  exportPdfError.value = ''

  try {
    const { buildTryoutScoreReport } = await import('~/utils/tryoutReportPdf.js')
    const { doc, filename } = await buildTryoutScoreReport(filteredTryouts.value, {
      targetScore: settings.value.targetScore,
      timeZone: settings.value.timezone,
      applicationFilter: selectedApplicationName.value,
      searchTerm: searchQuery.value.trim(),
    })
    doc.save(filename)
  } catch (error) {
    console.error('Failed to generate Try Out score report PDF.', error)
    exportPdfError.value = 'Laporan PDF gagal disiapkan. Silakan coba lagi.'
  } finally {
    exportingPdf.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-5 pb-4">
    <!-- CONTEXT & HEADER SUB-BAR -->
    <div class="relative bg-surface p-4 rounded-xl border-2 border-ink manga-shadow overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 manga-dots opacity-15 pointer-events-none rotate-12" />
      <div class="relative z-10 flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center px-2 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] uppercase tracking-wider font-bold rounded">
            MODUL MANAJEMEN DATA
          </span>
          <span class="text-[10px] text-ink-muted font-bold tracking-tight uppercase">ARSIP DATABASE</span>
        </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 class="font-condensed text-[28px] text-ink uppercase tracking-tight font-extrabold leading-none">
              KELOLA DATA &amp; PLATFORM
            </h1>
            <p class="text-xs text-ink-muted mt-1">
              Aplikasi dan hasil tryout dari database.
            </p>
          </div>
          <div class="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <PwaInstallButton />
            <button type="button" @click="openApplicationForm()" class="w-full md:w-auto px-5 h-11 bg-primary text-on-primary font-condensed text-lg tracking-wider uppercase font-bold rounded-lg border-2 border-ink flex items-center justify-center gap-1.5 manga-shadow active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer shrink-0">
              <PlusSquare class="w-5 h-5" />
              <span>+ DAFTAR PLATFORM BARU</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Responsive 2-Column Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <!-- LEFT COLUMN: PLATFORMS + LOCAL STORAGE -->
      <div class="lg:col-span-5 flex flex-col gap-5">
        <!-- SECTION 1: PLATFORM TRYOUT TERDAFTAR -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="font-condensed text-2xl text-ink uppercase tracking-tight font-bold leading-none">
                APLIKASI TRYOUT
              </h2>
              <span class="px-2 py-0.5 bg-ink text-surface text-[10px] uppercase font-bold rounded">{{ platforms.length || 'BELUM ADA' }}</span>
            </div>
            <span class="text-[10px] text-ink-muted uppercase font-bold">Konfigurasi IRT</span>
          </div>

          <div class="flex flex-col gap-2.5">
            <EmptyStateCard
              v-if="platforms.length === 0"
              title="Belum Ada Aplikasi"
              description="Tambahkan aplikasi tryout agar hasil dapat dikaitkan dengan penyedianya."
              cta-label="+ Tambah Aplikasi"
              :on-cta="() => openApplicationForm()"
            />
            <div v-for="pf in platforms" :key="pf.id" class="bg-surface p-3.5 rounded-xl border-2 border-ink manga-shadow-sm flex items-center justify-between gap-2">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-8 h-8 rounded border border-ink shrink-0" :style="{ backgroundColor: pf.colorHex }">
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-sm font-bold text-ink truncate">{{ pf.name }}</span>
                  <span class="text-[11px] text-ink-muted truncate">
                    {{ tryouts.filter((tryout) => tryout.applicationId === pf.id).length }} tryout
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button type="button" :aria-label="`Edit aplikasi ${pf.name}`" @click="openApplicationForm(pf)" class="w-8 h-8 rounded bg-surface-container border border-ink flex items-center justify-center text-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer">
                  <Edit3 class="w-4 h-4" />
                </button>
                <button type="button" :aria-label="`Hapus platform ${pf.name}`" @click="askConfirm({
                  title: `Hapus Platform ${pf.name}?`,
                  description: `Hapus aplikasi ${pf.name} dari database. Catatan tryout terkait tetap tersimpan.`,
                  confirmLabel: 'Ya, Hapus',
                  onConfirm: () => deletePlatform(pf.id),
                })" class="w-8 h-8 rounded bg-manga-red-soft border border-ink flex items-center justify-center text-manga-red-dark shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <button type="button" @click="openApplicationForm()" class="w-full py-3 rounded-xl bg-surface-container-lowest border-2 border-dashed border-ink text-ink font-condensed text-lg tracking-wider uppercase font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-all cursor-pointer">
              <PlusSquare class="w-5 h-5" />
              <span>+ TAMBAH PLATFORM BARU</span>
            </button>

            <div class="p-3 rounded-lg bg-surface-container-low border border-ink flex items-start gap-2 manga-shadow-sm">
              <ShieldCheck class="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p class="text-[11px] text-ink leading-snug">
                <strong class="font-bold text-primary">PENTING:</strong> Menghapus platform yang memiliki riwayat nilai akan mengarsipkan nilai terkait secara aman tanpa menghapus data mentah UTBK.
              </p>
            </div>
          </div>
        </section>

        <!-- DATABASE SUMMARY -->
        <div class="bg-surface p-4 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Database class="w-5 h-5 text-primary" />
              <span class="font-condensed text-lg uppercase text-ink font-bold">RINGKASAN DATABASE</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 bg-paper p-2.5 rounded-lg border border-ink/20">
            <div class="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
              <span class="text-[9px] text-primary font-bold uppercase">TRYOUT</span>
              <span class="font-bebas text-3xl text-ink leading-none my-1 tabular-nums">{{ tryouts.length || '—' }}</span>
              <span class="text-[9px] text-ink-muted uppercase font-bold text-center">Tercatat</span>
            </div>
            <div class="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
              <span class="text-[9px] text-primary font-bold uppercase">PLATFORM</span>
              <span class="font-bebas text-3xl text-primary leading-none my-1 tabular-nums">{{ platforms.length || '—' }}</span>
              <span class="text-[9px] text-manga-red-dark uppercase font-bold text-center">Tersimpan</span>
            </div>
            <div class="flex flex-col items-center bg-surface p-2 rounded border border-ink shadow-[1.5px_1.5px_0px_#171717]">
              <span class="text-[9px] text-primary font-bold uppercase">LOG BELAJAR</span>
              <div class="flex items-baseline my-1">
                <span class="font-bebas text-3xl text-ink leading-none tabular-nums">{{ sessions.length ? totalStudyHours : '—' }}</span>
                <span class="text-[9px] text-ink-muted font-bold ml-0.5">JAM</span>
              </div>
              <span class="text-[9px] text-ink-muted uppercase font-bold text-center">Total Durasi</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <button type="button" :disabled="exportingPdf || filteredTryouts.length === 0" @click="exportScoreReportPdf" class="h-10 bg-surface-container text-ink font-condensed text-sm font-bold uppercase tracking-wide rounded-lg border border-ink flex items-center justify-center gap-1.5 manga-shadow-sm active:translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
              <span v-if="exportingPdf" class="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" aria-hidden="true" />
              <FileText v-else class="w-4 h-4" />
              <span>{{ exportingPdf ? 'Menyiapkan laporan...' : 'Ekspor PDF' }}</span>
            </button>
            <button type="button" @click="openTryoutForm()" class="h-10 bg-ink text-surface font-condensed text-sm font-bold uppercase tracking-wide rounded-lg border border-ink flex items-center justify-center gap-1.5 manga-shadow-sm active:translate-y-0.5 cursor-pointer">
              <PlusSquare class="w-4 h-4" />
              <span>Tambah Tryout</span>
            </button>
          </div>
          <p v-if="!filteredTryouts.length" class="text-[11px] leading-snug text-ink-muted">
            Tidak ada data Try Out untuk filter aktif; laporan PDF tidak dapat dibuat.
          </p>
          <p v-if="exportPdfError" role="alert" class="text-[11px] leading-snug text-manga-red-dark">
            {{ exportPdfError }}
          </p>
        </div>
      </div>

      <!-- RIGHT COLUMN: ARSIP RIWAYAT TRYOUT -->
      <section class="lg:col-span-7 flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <h2 class="font-condensed text-2xl text-ink uppercase tracking-tight font-bold leading-none">ARSIP RIWAYAT TRYOUT</h2>
            <span class="px-2 py-0.5 bg-manga-red-soft text-manga-red-dark text-[10px] uppercase font-bold rounded">{{ tryouts.length ? `${tryouts.length} SESI TERCATAT` : 'BELUM ADA DATA' }}</span>
          </div>
          <p class="text-xs text-ink-muted">Hasil komparasi skor 7 subtes TPS &amp; Literasi.</p>
        </div>

        <!-- Search & Quick Filter Chips -->
        <div class="flex flex-col gap-2">
          <div class="relative w-full">
            <Search class="w-4 h-4 text-ink-muted absolute left-3 top-3.5" />
            <input v-model="searchQuery" type="text" placeholder="Cari nama tryout atau aplikasi..." class="w-full h-11 pl-9 pr-3 bg-surface text-ink text-sm rounded-lg border-2 border-ink manga-shadow-sm focus:outline-none placeholder:text-ink-muted">
          </div>

          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button type="button" @click="filterPfId = 'ALL'" class="px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap border border-ink manga-shadow-sm cursor-pointer" :class="filterPfId === 'ALL' ? 'bg-ink text-surface' : 'bg-surface text-ink'">
              Semua ({{ tryouts.length || '—' }})
            </button>
            <button v-for="pf in platforms" :key="pf.id" type="button" @click="filterPfId = pf.id" class="px-3 py-1 rounded-lg text-xs font-bold uppercase whitespace-nowrap border border-ink manga-shadow-sm cursor-pointer" :class="filterPfId === pf.id ? 'bg-ink text-surface' : 'bg-surface text-ink'">
              {{ pf.name }} ({{ tryouts.filter((tryout) => tryout.applicationId === pf.id).length }})
            </button>
          </div>
        </div>

        <!-- Tryout Cards Stack -->
        <EmptyStateCard
          v-if="filteredTryouts.length === 0"
          :title="tryouts.length ? 'Arsip Tidak Ditemukan' : 'Belum Ada Hasil Tryout'"
          :description="tryouts.length ? 'Tidak ada catatan yang cocok dengan pencarian atau filter aplikasi.' : 'Catat hasil tryout untuk mulai membangun arsip nilaimu.'"
          cta-label="+ Catat Tryout Baru"
          :on-cta="() => openTryoutForm()"
        />
        <div v-else class="flex flex-col gap-3">
          <div v-for="record in filteredTryouts" :key="record.id" class="bg-surface p-3.5 rounded-xl border-2 border-ink manga-shadow flex flex-col gap-2.5">
            <div class="flex items-start justify-between gap-2">
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: record.applicationColor }" />
                  <span class="text-[10px] text-ink-muted uppercase font-bold truncate">
                    {{ record.applicationName ? `${record.applicationName} • ` : '' }}{{ formatIndonesianTitleDate(record.date) }}
                  </span>
                </div>
                <h3 class="text-base font-bold text-ink mt-0.5 truncate">{{ record.title }}</h3>
              </div>
              <div class="flex flex-col items-end shrink-0">
                <div class="flex items-baseline gap-1">
                  <span class="font-bebas text-[34px] text-ink leading-none tabular-nums">{{ record.averageScore }}</span>
                  <span class="text-[10px] text-ink-muted font-bold">PTS</span>
                </div>
                <span v-if="record.averageScore !== null && settings.targetScore !== null" class="px-1.5 py-0.5 text-[9px] font-bold uppercase mt-0.5 rounded tabular-nums" :class="record.averageScore - settings.targetScore >= 0 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'">
                  {{ record.averageScore - settings.targetScore >= 0 ? `+${record.averageScore - settings.targetScore}` : record.averageScore - settings.targetScore }} VS TARGET
                </span>
              </div>
            </div>

            <div class="bg-paper p-2.5 rounded-lg border border-ink/20 flex flex-col gap-1.5">
              <div class="flex items-center justify-between text-[10px] text-ink-muted uppercase font-bold">
                <span>Rincian Nilai Kunci:</span>
                <span v-if="settings.targetUniversity" class="text-primary">TARGET: {{ settings.targetUniversity }}</span>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div class="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                  <span class="text-[9px] text-ink-muted uppercase font-bold">Pen. Mat</span>
                  <span class="font-bebas text-xl text-primary leading-none mt-0.5 tabular-nums">{{ record.scores.PM ?? '—' }}</span>
                </div>
                <div class="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                  <span class="text-[9px] text-ink-muted uppercase font-bold">Pen. Kuan</span>
                  <span class="font-bebas text-xl text-ink leading-none mt-0.5 tabular-nums">{{ record.scores.PK ?? '—' }}</span>
                </div>
                <div class="bg-surface p-1.5 rounded border border-ink flex flex-col items-center shadow-[1.5px_1.5px_0px_#171717]">
                  <span class="text-[9px] text-ink-muted uppercase font-bold">Pen. Umum</span>
                  <span class="font-bebas text-xl text-ink leading-none mt-0.5 tabular-nums">{{ record.scores.PU ?? '—' }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span v-if="record.notes" class="text-[10px] px-2 py-0.5 bg-surface-container rounded font-bold text-ink uppercase">Ada catatan</span>
              <div class="flex items-center gap-2">
                <button type="button" @click="askConfirm({
                  title: 'Hapus Catatan Tryout?',
                  description: `Nilai ${record.title} (${record.averageScore} pts) dan riwayat 7 subtes akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`,
                  confirmLabel: 'Ya, Hapus Saja',
                  onConfirm: () => deleteTryout(record.id),
                })" class="px-3 h-8 bg-manga-red-soft text-manga-red-dark text-xs font-bold uppercase rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer">
                  Hapus
                </button>
                <button type="button" @click="openTryoutForm(record.id)" class="px-4 h-8 bg-primary text-on-primary font-condensed text-sm font-bold uppercase tracking-wide rounded border border-ink shadow-[1.5px_1.5px_0px_#171717] active:translate-y-0.5 cursor-pointer">
                  Detail Sesi
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
