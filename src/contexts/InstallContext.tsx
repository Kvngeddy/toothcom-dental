import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface InstallContextValue {
  canInstall: boolean
  isInstalled: boolean
  isIOS: boolean
  install: () => Promise<void>
}

const InstallContext = createContext<InstallContextValue | null>(null)

export function InstallProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS] = useState(() => /iPhone|iPad|iPod/i.test(navigator.userAgent))

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)')
    const syncInstalled = () => {
      setIsInstalled(standaloneQuery.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    }
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    syncInstalled()
    standaloneQuery.addEventListener('change', syncInstalled)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      standaloneQuery.removeEventListener('change', syncInstalled)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <InstallContext.Provider value={{ canInstall: Boolean(installPrompt), isInstalled, isIOS, install }}>
      {children}
    </InstallContext.Provider>
  )
}

export function useInstallApp() {
  const context = useContext(InstallContext)
  if (!context) throw new Error('useInstallApp must be used within InstallProvider')
  return context
}