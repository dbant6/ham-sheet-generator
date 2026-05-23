import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

/**
 * Form state lives entirely in React + (optionally) localStorage.
 * No network, no analytics, no telemetry. This is deliberate.
 */

const STORAGE_KEY = 'ham-sheet:v1'
const STORAGE_FLAG = 'ham-sheet:persist-opted-in'

export const initialData = {
  // 1–8: Patient Details / Alerts
  fullName: '',
  dob: '',
  address: '',
  phone: '',
  email: '',
  dnr: '',           // 'Yes' | 'No' | 'Unknown'
  bloodType: '',     // dropdown
  pcp: '',           // name + phone freeform

  // 9–14: Medical content + contacts
  history: '',
  allergies: '',
  medications: '',
  emergencyContacts: '',
  preferredHospital: '',
  additionalInfo: '',

  // 15: Consent
  consent: false,
}

const defaultState = {
  step: 0,            // 0..4
  data: initialData,
  persist: false,     // localStorage opt-in (default OFF)
  errors: {},
}

function reducer(state, action) {
  switch (action.type) {
    case 'set_field':
      return {
        ...state,
        data: { ...state.data, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: undefined },
      }
    case 'merge_data':
      // Used by the intake upload: merges parsed fields into existing data
      // without clobbering anything the user has typed.
      return {
        ...state,
        data: { ...state.data, ...(action.data || {}) },
        errors: {},
      }
    case 'set_step':
      return { ...state, step: action.step }
    case 'set_errors':
      return { ...state, errors: action.errors }
    case 'set_persist':
      return { ...state, persist: action.value }
    case 'hydrate':
      return { ...state, ...action.payload }
    case 'reset':
      return { ...defaultState, persist: state.persist }
    default:
      return state
  }
}

const FormCtx = createContext(null)

export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultState, (init) => {
    // Hydrate only if user previously opted-in
    try {
      const opted = localStorage.getItem(STORAGE_FLAG) === '1'
      if (!opted) return init
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...init, persist: true }
      const saved = JSON.parse(raw)
      return {
        ...init,
        persist: true,
        data: { ...init.data, ...(saved.data || {}) },
        step: typeof saved.step === 'number' ? saved.step : 0,
      }
    } catch {
      return init
    }
  })

  // Persist whenever data/step change AND user has opted in.
  useEffect(() => {
    try {
      if (state.persist) {
        localStorage.setItem(STORAGE_FLAG, '1')
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: state.data, step: state.step }),
        )
      } else {
        localStorage.removeItem(STORAGE_FLAG)
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      /* storage might be disabled — silently ignore */
    }
  }, [state.persist, state.data, state.step])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <FormCtx.Provider value={value}>{children}</FormCtx.Provider>
}

export function useForm() {
  const ctx = useContext(FormCtx)
  if (!ctx) throw new Error('useForm must be used inside <FormProvider>')
  return ctx
}
