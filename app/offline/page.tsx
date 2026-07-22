export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center safe-area-top safe-area-bottom bg-white">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <span className="text-2xl">📡</span>
      </div>
      <h1 className="text-lg font-bold text-text-primary">Tidak ada koneksi</h1>
      <p className="text-sm text-text-secondary mt-2 max-w-xs">
        Periksa internet Anda lalu coba lagi. Beberapa halaman mungkin masih tersedia dari cache.
      </p>
      <a
        href="/"
        className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm"
      >
        Coba lagi
      </a>
    </div>
  );
}
