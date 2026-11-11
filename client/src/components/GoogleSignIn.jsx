import { useEffect, useRef, useState, useCallback } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let scriptPromise = null
function loadGis() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null // allow a retry to re-attempt the load
      reject(new Error('Could not load Google sign-in'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

/**
 * Renders Google's official Sign in with Google button.
 * Calls onCredential(idToken) with the Google ID token on success.
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured.
 * If Google's script is blocked (ad-blocker, strict privacy settings,
 * network filter), shows a visible fallback with a retry button instead
 * of silently rendering nothing.
 */
export default function GoogleSignIn({ text = 'signin_with', onCredential, onError }) {
  const divRef = useRef(null)
  const cbRef = useRef({ onCredential, onError })
  cbRef.current = { onCredential, onError }
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const render = useCallback(() => {
    if (!CLIENT_ID || !divRef.current) return undefined
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !divRef.current) return
        setLoadFailed(false)
        divRef.current.innerHTML = ''
        try {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (resp) => {
              if (resp?.credential) cbRef.current.onCredential(resp.credential)
              else cbRef.current.onError?.(new Error('Google did not return a credential'))
            },
            auto_select: false,
          })
          window.google.accounts.id.renderButton(divRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text,
            shape: 'pill',
          })
        } catch (err) {
          setLoadFailed(true)
          cbRef.current.onError?.(err)
        }
        // If Google silently rendered nothing (blocked FedCM/cookies), the
        // container stays empty — surface the fallback instead of a hole.
        setTimeout(() => {
          if (!cancelled && divRef.current && divRef.current.childElementCount === 0) {
            setLoadFailed(true)
          }
        }, 6000)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadFailed(true)
          cbRef.current.onError?.(err)
        }
      })
    return () => {
      cancelled = true
    }
  }, [text, attempt])

  useEffect(() => render(), [render])

  if (!CLIENT_ID) return null

  if (loadFailed) {
    return (
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setLoadFailed(false)
            setAttempt((a) => a + 1)
          }}
          className="btn-secondary w-full !py-3"
        >
          <span className="font-bold mr-2">G</span> Continue with Google — tap to retry
        </button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Google&rsquo;s sign-in couldn&rsquo;t load. An ad-blocker, strict tracking protection, or a
          network filter may be blocking <span className="font-mono">accounts.google.com</span>.
          Try again, or use another browser / turn the blocker off for this site.
        </p>
      </div>
    )
  }

  return <div ref={divRef} className="flex justify-center min-h-[44px]" />
}
