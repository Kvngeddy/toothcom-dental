import { useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useInstallApp } from '@/contexts/InstallContext'

export default function MobileInstallButton() {
  const { canInstall, install, isInstalled, isIOS } = useInstallApp()
  const [showInstructions, setShowInstructions] = useState(false)

  async function handleInstall() {
    if (canInstall) {
      await install()
    } else {
      setShowInstructions(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleInstall()}
        disabled={isInstalled}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm font-medium text-slate-text hover:border-[var(--color-clinic-orange)] disabled:cursor-default disabled:opacity-60 md:hidden"
      >
        <Download size={16} aria-hidden="true" />
        {isInstalled ? 'App installed' : 'Install app'}
      </button>

      {showInstructions && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
          <section role="dialog" aria-modal="true" aria-labelledby="install-app-title" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <header className="mb-4 flex items-center justify-between">
              <h2 id="install-app-title" className="font-display text-lg font-semibold text-slate-text">Install Toothcom</h2>
              <button type="button" onClick={() => setShowInstructions(false)} aria-label="Close install instructions" className="p-1 text-slate-muted hover:text-slate-text">
                <X size={20} />
              </button>
            </header>
            {isIOS ? (
              <p className="text-sm leading-6 text-slate-text">
                In Safari, tap <Share className="mx-1 inline-block" size={16} aria-label="Share" /> Share, then choose <strong>Add to Home Screen</strong>.
              </p>
            ) : (
              <p className="text-sm leading-6 text-slate-text">
                Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
              </p>
            )}
            <button type="button" onClick={() => setShowInstructions(false)} className="mt-5 w-full rounded-lg bg-[var(--color-clinic-orange)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-clinic-orange-dark)]">
              Done
            </button>
          </section>
        </div>
      )}
    </>
  )
}