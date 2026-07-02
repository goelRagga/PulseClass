import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export type SelectOption<T extends string | number> = {
  label: string
  value: T
}

export function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  className,
  disabled = false,
}: {
  value?: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedIndex = useMemo(
    () => options.findIndex(opt => opt.value === value),
    [options, value]
  )
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const target = listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${activeIndex}"]`)
    target?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, options.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      onChange(options[activeIndex].value)
      setOpen(false)
      buttonRef.current?.focus()
      return
    }
  }

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onKeyDown={onButtonKeyDown}
        onClick={() => setOpen(prev => !prev)}
        className={clsx(
          'w-full flex items-center justify-between gap-3 bg-white/85 border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-left shadow-sm backdrop-blur-xl',
          'focus:outline-none focus:ring-2 focus:ring-[#4648d4]/20 focus:border-[#4648d4] transition-all',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className={clsx('truncate', selected ? 'text-gray-900' : 'text-gray-400')}>{selected?.label || placeholder}</span>
        <ChevronDown className={clsx('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]"
        >
          <div className="max-h-64 overflow-auto py-1.5">
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  data-option-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={clsx(
                    'w-full px-3.5 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-colors',
                    isActive ? 'bg-[#eff4ff] text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                    isSelected && 'font-semibold'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-[#4648d4] shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
